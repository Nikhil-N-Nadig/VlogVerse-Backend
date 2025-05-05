import mongoose, { isValidObjectId } from "mongoose"
import {Video} from "../models/video.model.js"
import { Subscription } from "../models/subscription.models.js"
import { asyncHandler,ApiError,ApiResponse } from "../utils/index.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.


    if(!req.user._id){
        throw new ApiError(400,"UserId is required")
    }

    const userId=new mongoose.Types.ObjectId(req.user?._id)

    const totalVideos=await Video.countDocuments({owner:userId});

    const totalSubscribers=await Subscription.countDocuments({channel:userId});

    if(!totalVideos){
        return res.status(200).json(new ApiResponse(200,{videoCount:0,subscriberCount:totalSubscribers},"No videos in channel"))
    }

    const totalVideoViews = await Video.aggregate([
        {
            $match:{
                owner:userId
            }
        },
        {
            $lookup:{
                from:'likes',
                localField:'_id',
                foreignField:'video',
                as:'videoLikes',
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$videoLikes" }
            }
        },
        {
            $group:{
                _id:null,
                totalViews:{ $sum : "$views"},
                totalLikes:{ $sum : "$likesCount"}
            }
        }
    ])

    if(totalVideoViews.length===0){
        throw new ApiError(400,'Error fetching User Video Details')
    }

        const totalViews = totalVideoViews[0]?.totalViews || 0;
        const totalLikes = totalVideoViews[0]?.totalLikes || 0;

    const ChannelStatus={
        vidoeCount:totalVideos,
        SubscriberCount:totalSubscribers,
        viewCount:totalViews,
        likeCount:totalLikes
    }

    return res
    .status(200)
    .json(new ApiResponse(200,ChannelStatus,"Channel Status Fetched successfully"));
    
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const {page = 1, limit = 10} = req.query

    if(!req.user._id){
        throw new ApiError(400,"UserId is required")
    }

    const userId = new mongoose.Types.ObjectId(req.user?._id)

    const aggregateQuery = Video.aggregate([
        {
            $match:{
                owner:userId
            }
        }
    ])

    const options={
        page:parseInt(page),
        limit:parseInt(limit)
    }

    const videos = await Video.aggregatePaginate(aggregateQuery,options);

    return res
    .status(200)
    .json(new ApiResponse(200,videos,"Channel Videos fetched successfully"));

})

const watchVideo = asyncHandler(async(req,res)=>{
    let {videoId}=req.params;

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"Valid VideoIs is required")
    }

    videoId=new mongoose.Types.ObjectId(videoId)

    
    const video = await Video.findById(
        videoId
    )

    if(!video){
        throw new ApiError(400,"Error fetching video")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,video,"Video fetched successfully"))
})

export {
    getChannelStats, 
    getChannelVideos,
    watchVideo
    }