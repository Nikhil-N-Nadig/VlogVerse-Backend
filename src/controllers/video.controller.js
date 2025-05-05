import mongoose, {isValidObjectId} from "mongoose"
import { Video } from "../models/video.model.js"
import { ApiError,ApiResponse,asyncHandler,cloudinaryFileUpload,cloudinaryFileDestroy,cloudinaryVideoDestroy } from "../utils/index.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query='', sortBy='createdAt', sortType='desc', userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    //Info of parameters taken for the pagination
    // page: page no.
    // limit: limit of objects in each page
    // query: Video title name
    // sortBy: Sorting based on the particular field
    // sortType: Asc or desc
    // userId : to get their videos

    const sortOrder=sortType==="asc"?1:-1; //mongoose takes 1 as asc and -1 as desc

    const matchInstance={
        isPublished:true
    } //creating an video object to be matched while fetching videos

    if(query && query.trim()){
        matchInstance.title={$regex:query.trim(),$options:'i'}
    } //Adding title for search

    if(userId){
        matchInstance.owner=new mongoose.Types.ObjectId(userId);
    } //Adding owner for search


    //Only creating an aggregate for video and not executing it immediately
    const aggregateQuery=Video.aggregate([
        {
            $match:matchInstance
        },
        {
            $lookup:{
                from:'users',
                as:'owner',
                localField:'owner',
                foreignField:'_id',
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{
                    $first:'$owner'
                }
            }
        },
        {
            $sort:{
                [sortBy]:sortOrder
            }
        }
    ]);

    //Options for aggregate pagination
    const options={
        page:parseInt(page),
        limit:parseInt(limit)
    }

    //Fetching the videos based on Pagination with aggregate query
    const finalVideos=await Video.aggregatePaginate(aggregateQuery,options);

    if(!finalVideos){
        throw new ApiError(400,"Error while fetching videos with pagination")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,finalVideos,"Videos fetched successfully"))


})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!(title && description)){
        throw new ApiError(400,"Both title and description fields are required");
    }

    console.log(req.files)

    const videoLocalPath=req.files?.videoFile[0]?.path;
    const thumbnailLocalPath=req.files?.thumbnail[0]?.path;

    //Can also use this
    // if(req.files && Array.isArray(req.files.video) && req.files.video.length>0 ) {}

    if(!videoLocalPath || !thumbnailLocalPath){
        throw new ApiError(404,"Video and Thumbnail files are required");
    }

    const videoFile=await cloudinaryFileUpload(videoLocalPath);
    console.log("Returned value from cloudinary after upload: ",videoFile)
    const thumbnail=await cloudinaryFileUpload(thumbnailLocalPath);

    if(!videoFile){
        console.error("Cloudinary upload error: ", videoFile);
        throw new ApiError(400,"Error while uploading video file")
    }

    const duration=videoFile?.duration;

    if(!duration){
        throw new ApiError(400,"Cant get video duration")
    }

    if(!thumbnail){
        console.error("Cloudinary upload error: ", thumbnail);
        throw new ApiError(400,"Error while uploading thumbnail file")
    }

    //Store user_id in owner instead of this => const user=await User.findById(req.user?._id).select("-password -refreshToken")

    const video=await Video.create({
        title,
        description,
        duration,
        owner:req.user?._id,
        isPublished:true,
        videoFile:videoFile?.url,
        thumbnail:thumbnail?.url
    })

    if(!video){
        throw new ApiError(400,"Error while creating video instance");
    }

    return res
    .status(201)
    .json(new ApiResponse(201,video,"Video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    //Get video by id
    const { videoId } = req.params;

    if(!videoId){
        throw new ApiError(400,"Video_id must be available in url");
    }
    const video=await Video.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(videoId) 
            }
        },
        {
            $lookup:{
                from:'users',
                as:"owner",
                localField:'owner',
                foreignField:'_id',
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1,
                            email:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{
                    $first:"$owner"
                }
            }
        }
    ])

    if(!video[0]){
        throw new ApiError(400,"No video found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,video[0],"Video fetched successfully"))

})

const updateVideoDetails = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail

    const { videoId } = req.params;

    if(!videoId){
        throw new ApiError(400,"Video_id must be available in url");
    }

    const { title,description }=req.body;

    if(!(title && description)){
        throw new ApiError(400,"Both title and description is needed")
    }

    const video=await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title,
                description
            }
        },
        {
            new:true
        }
    )

    if(!video){
        throw new ApiError(400,"Error while updating video details")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,video,"Video details updated successfully"))

})

const updateVideoThumbnail=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;

    if(!videoId){
        throw new ApiError(400,"Video_id must be available in url");
    }

    const thumbnailLocalPath=req.file?.path;

    if(!thumbnailLocalPath){
        throw new ApiError(400,"Thumbnail File is required")
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400,"Error while fetching video")
    }

    const oldThumbnail = video?.thumbnail;

    const newThumbnail=await cloudinaryFileUpload(thumbnailLocalPath);

    if(!newThumbnail){
        throw new ApiError(400,"Error while uploading file")
    }

    video.thumbnail=newThumbnail?.url;
    await video.save({validateBeforeSave:false})

    if(oldThumbnail){

        const {result} = await cloudinaryFileDestroy(oldThumbnail);
        if(result!='ok'){
            console.warn("Failed to delete old thumbnail from Cloudinary");
        }

    }
    
    return res
    .status(200)
    .json(new ApiResponse(200,video,"Video thumbnail updated successfully"))

})


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!videoId){
        throw new ApiError(400,"Video_id must be available in url");
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(200,"No video found to delete")
    }

    if(video?.videoFile){
        const {result}=await cloudinaryVideoDestroy(video?.videoFile);
        if(result!=='ok'){
            console.warn("Failed to delete videoFile from Cloudinary");
        }
    }

    if(video?.thumbnail){
        const {result}=await cloudinaryFileDestroy(video?.thumbnail);
        if(result!=='ok'){
            console.warn("Failed to delete thumbnail from Cloudinary");
        }
    }

    const {deletedCount} =await Video.deleteOne({
        _id:videoId
    })

    if(deletedCount===0){
        throw new ApiError(400,"Error deleting the video from database")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Video deleted successfully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400,"Video_id must be available in url");
    }

    const video=await Video.findById(videoId)

    if(!video){
        throw new ApiError(400,"Cant find video to update")
    }

    video.isPublished=!video.isPublished;

    await video.save({validateBeforeSave:false});

    return res
    .status(200)
    .json(new ApiResponse(200,video,"Publish Status updated successfully"))

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideoDetails,
    deleteVideo,
    togglePublishStatus,
    updateVideoThumbnail
}