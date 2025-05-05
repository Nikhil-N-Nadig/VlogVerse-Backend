import mongoose, {isValidObjectId} from "mongoose"
import { Like } from "../models/like.models.js"
import { ApiResponse,ApiError,asyncHandler } from "../utils/index.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on video
    let {videoId} = req.params

    if(!videoId){
        throw new ApiError(400,"Video ID is required");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID format");
    }

    videoId=new mongoose.Types.ObjectId(videoId);
    const userId=new mongoose.Types.ObjectId(req.user?._id);

    const like=await Like.findOne({
        likedby:userId,
        video:videoId
    })

    if(!like){
        const new_like=await Like.create({
            likedby:userId,
            video:videoId
        });
        if(!new_like){
            throw new ApiError(400,"Error creating like in database")
        }

        return res
        .status(201)
        .json(new ApiResponse(201,{like:new_like,liked:true},"Liked video succesfully"))
    }

    const {deletedCount}=await Like.deleteOne({
            likedby:userId,
            video:videoId
    })

    if(deletedCount==0){
        throw new ApiError(400,"Error deleting like in database")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{liked:false},"Disliked video successfully"))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    let {commentId} = req.params
    //TODO: toggle like on comment

    if(!commentId){
        throw new ApiError(400,"Comment ID is required")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid comment ID format")
    }

    commentId=new mongoose.Types.ObjectId(commentId);
    const userId=new mongoose.Types.ObjectId(req.user?._id)

    const like=await Like.findOne({
        likedby:userId,
        comment:commentId
    })

    if(!like){
        const new_like=await Like.create({
            likedby:userId,
            comment:commentId
        })

        if(!new_like){
            throw new ApiError(400,"Error creating like in database")
        }

        return res
        .status(201)
        .json(new ApiResponse(201,{like:new_like,liked:true},"Liked comment succesfully"))
    }

    const {deletedCount}=await Like.deleteOne({
        likedby:userId,
        comment:commentId
    })

    if(deletedCount==0){
        throw new ApiError(400,"Error deleting like in database")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{liked:false},"Disliked comment successfully"))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    let {tweetId} = req.params
    //TODO: toggle like on tweet

    if(!tweetId){
        throw new ApiError(400,"Tweet ID is required")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweet ID format")
    }

    tweetId=new mongoose.Types.ObjectId(tweetId);
    const userId=new mongoose.Types.ObjectId(req.user?._id)

    const like=await Like.findOne({
        likedby:userId,
        tweet:tweetId
    })

    if(!like){
        const new_like=await Like.create({
            likedby:userId,
            tweet:tweetId
        })

        if(!new_like){
            throw new ApiError(400,"Error creating like in database")
        }

        return res
        .status(201)
        .json(new ApiResponse(201,{like:new_like,liked:true},"Liked tweet succesfully"))
    }

    const {deletedCount}=await Like.deleteOne({
        likedby:userId,
        tweet:tweetId
    })

    if(deletedCount==0){
        throw new ApiError(400,"Error deleting like in database")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{liked:false},"Disliked tweet successfully"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const {page = 1, limit = 10} = req.query

    const userId=new mongoose.Types.ObjectId(req.user?._id);

    const aggregateQuery=Like.aggregate([
        {
            $match:{
                likedby:userId,
                video:{ $ne:null }
            }
        },
        {
            $sort:{ createdAt:-1 }
        },
        {
            $lookup:{
                from:'videos',
                localField:'video',
                foreignField:'_id',
                as:'video',
                pipeline:[
                    {
                        $lookup:{
                            from:'users',
                            localField:'owner',
                            foreignField:'_id',
                            as:'owner',
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind:'$owner'
                    }
                ]
            }
        },
        {
            $unwind:'$video'
        },
        {
            $project:{
                _id: '$video._id',
                videoFile:"$video.videoFile",
                thumbnail:"$video.thumbnail",
                title: '$video.title',
                description: '$video.description',
                owner: '$video.owner',
                views:'$video.views',
                duration:'$video.duration',
                createdAt: '$video.createdAt',
                updatedAt: '$video.updatedAt',
            }
        }
    ])

    const options={
        page:parseInt(page),
        limit:parseInt(limit)
    }

    const likedVideos=await Like.aggregatePaginate(aggregateQuery,options)

    if(!likedVideos || likedVideos.docs.length === 0){
        return res.status(200).json(new ApiResponse(200,{},"No liked videos"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200,likedVideos,"Liked videos fetched succesfully"))
})

const getLikedTweets = asyncHandler(async(req,res)=>{
    const userId=new mongoose.Types.ObjectId(req.user?._id);

    const likedTweets=await Like.aggregate([
        {
            $match:{
                likedby:userId,
                tweet:{$ne:null}
            }
        },
        {
            $sort:{ createdAt:-1 }
        },
        {
            $lookup:{
                from:'tweets',
                localField:'tweet',
                foreignField:'_id',
                as:'tweet',
                pipeline:[
                    {
                        $lookup:{
                            from:'users',
                            localField:'owner',
                            foreignField:'_id',
                            as:'owner',
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
                        $unwind:"$owner"
                    },
                    {
                        $project:{
                            _id:1,
                            content:1,
                            owner:1
                        }
                    }
                ]
            }
        },
        {
            $unwind:'$tweet'
        },

    ])

    if(!likedTweets || likedTweets.length===0){
        return res.status(200).json(new ApiResponse(200,[],"No liked tweets"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200,likedTweets,"Liked tweets fetched successfully"))
})

const getVideoLikes = asyncHandler(async (req,res)=>{
    let {videoId} = req.params

    if(!videoId){
        throw new ApiError(400,"Video ID is required")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Video ID format is invalid")
    }

    videoId=new mongoose.Types.ObjectId(videoId)

    const videoLikes=await Like.aggregate([
        {
            $match:{
                video:videoId
            }
        },
        {
            $sort:{ createdAt:-1 }
        },
        {
            $lookup:{
                from:"users",
                localField:"likedby",
                foreignField:"_id",
                as:"likedby",
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
            $unwind:"$likedby"
        },
        {
            $project:{
                _id:1,
                likedby:1,
                video:1
            }
        }
    ])

    if(!videoLikes || videoLikes.length===0){
        return res.status(200).json(new ApiResponse(200,[],"No likes found"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200,videoLikes,"VideoLikes fetched successfully"))

})

const getCommentLikes = asyncHandler(async (req,res)=>{
    let {commentId} = req.params

    if(!commentId){
        throw new ApiError(400,"Comment ID is required")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Comment ID format is invalid")
    }

    commentId=new mongoose.Types.ObjectId(commentId)

    const commentLikes=await Like.aggregate([
        {
            $match:{
                comment:commentId
            }
        },
        {
            $sort:{ createdAt:-1 }
        },
        {
            $lookup:{
                from:"users",
                localField:"likedby",
                foreignField:"_id",
                as:"likedby",
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
            $unwind:"$likedby"
        },
        {
            $project:{
                _id:1,
                likedby:1,
                video:1
            }
        }
    ])

    if(!commentLikes || commentLikes.length===0){
        return res.status(200).json(new ApiResponse(200,[],"No likes found"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200,commentLikes,"Comment likes fetched successfully"))

})

const getTweetLikes = asyncHandler(async (req,res)=>{
    let {tweetId} = req.params

    if(!tweetId){
        throw new ApiError(400,"Tweet ID is required")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Tweet ID format is invalid")
    }

    tweetId=new mongoose.Types.ObjectId(tweetId)

    const tweetLikes=await Like.aggregate([
        {
            $match:{
                tweet:tweetId
            }
        },
        {
            $sort:{ createdAt:-1 }
        },
        {
            $lookup:{
                from:"users",
                localField:"likedby",
                foreignField:"_id",
                as:"likedby",
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
            $unwind:"$likedby"
        },
        {
            $project:{
                _id:1,
                likedby:1,
                video:1
            }
        }
    ])

    if(!tweetLikes || tweetLikes.length===0){
        return res.status(200).json(new ApiResponse(200,[],"No likes found"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200,tweetLikes,"Tweet likes fetched successfully"))

})

const getVideoLikecount = asyncHandler(async(req,res)=>{
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video ID format is invalid");
    }

    const likeCount = await Like.countDocuments({ video: videoId });

    return res
        .status(200)
        .json(new ApiResponse(200, { likeCount }, "Video like count fetched successfully"));
})

const getTweetLikecount = asyncHandler(async(req,res)=>{
    const { tweetId } = req.params;

    if (!tweetId) {
        throw new ApiError(400, "Tweet ID is required");
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Tweet ID format is invalid");
    }

    const likeCount = await Like.countDocuments({ tweet: tweetId });

    return res
        .status(200)
        .json(new ApiResponse(200, { likeCount }, "Tweet like count fetched successfully"));
})

const getCommentLikecount = asyncHandler(async(req,res)=>{
    const { commentId } = req.params;

    if (!commentId) {
        throw new ApiError(400, "Comment ID is required");
    }

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Comment ID format is invalid");
    }

    const likeCount = await Like.countDocuments({ comment: commentId });

    return res
        .status(200)
        .json(new ApiResponse(200, { likeCount }, "Comment like count fetched successfully"));
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getLikedTweets,
    getVideoLikes,
    getCommentLikes,
    getTweetLikes,
    getVideoLikecount,
    getTweetLikecount,
    getCommentLikecount
}