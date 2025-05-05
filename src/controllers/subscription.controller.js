import { ApiError,ApiResponse,asyncHandler } from "../utils/index.js"
import {Subscription} from "../models/subscription.models.js"
import mongoose from "mongoose"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if(!channelId){
        throw new ApiError(400,"Channel id is required")
    }

    const isSubscribed=await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId),
                subscriber:new mongoose.Types.ObjectId(req.user?._id)

            }
        },
    ])

    if(!(isSubscribed.length>0)){
        const subscribe=await Subscription.create({
            channel:channelId,
            subscriber:new mongoose.Types.ObjectId(req.user?._id)
        })

        if(!subscribe){
            throw new ApiError(400,"Error creating new subscribe instance")
        }

        return res
        .status(200)
        .json(new ApiResponse(200,subscribe,"Subscribed successfully"))
    }

    else{
        const {deletedCount}=await Subscription.deleteOne({
            _id:isSubscribed[0]._id
        })

        if(deletedCount===0){
            throw new ApiError(400,"Error deleting subscription from database")
        }

        return res
        .status(200)
        .json(new ApiResponse(200,{},"Unsubscribed successfully"))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    // const {channelId} = req.params

    // if(!channelId){
    //     throw new ApiError(400,"Channel ID is required")
    // }

    const subscribers=await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"users",
                as:'subscriber',
                localField:"subscriber",
                foreignField:"_id",
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
            $unwind:"$subscriber" //unwinds th array and gives the object inside it
        },
        {
            $project:{
                subscriber:1
            }
        }
    ])

    if (!subscribers || subscribers.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "No subscribers found"));
    }
    

    return res
    .status(200)
    .json(new ApiResponse(200, subscribers.map(s => s.subscriber),"Subscibers fetched successfully"))


})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    // const { subscriberId } = req.params

    // if(!subscriberId){
    //     throw new ApiError(400,"Subscriber id is required")
    // }

    const subscribedChannels=await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"users",
                as:"channel",
                localField:"channel",
                foreignField:"_id",
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
            $unwind:"$channel"
        },
        {
            $project:{
                channel:1
            }
        }
    ])

    if(!subscribedChannels || subscribedChannels.length===0){
        return res.status(200).json(new ApiResponse(200, [], "No subscribed channels found"));
    }

    return res
    .status(200)
    .json(new ApiResponse(200,subscribedChannels.map(s => s.channel),"Subscribed channels fetched successfully"))
})

const isSubscribed=asyncHandler(async(req,res)=>{
    const {channelId}=req.params

    if(!channelId){
        throw new ApiError(400,"Channel ID is required")
    }

    const subscribed=await Subscription.findOne({
                channel:new mongoose.Types.ObjectId(channelId),
                subscriber:new mongoose.Types.ObjectId(req.user?._id)
    })

    return res
    .status(200)
    .json(new ApiResponse(200,{subscribed:subscribed||null,isSubscribed:!!subscribed},"Checked succesfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    isSubscribed
}