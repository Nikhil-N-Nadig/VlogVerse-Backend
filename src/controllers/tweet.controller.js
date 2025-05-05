import mongoose, { isValidObjectId } from "mongoose"
import { asyncHandler,ApiError,ApiResponse } from "../utils/index.js"
import {Tweet} from "../models/tweet.models.js"
import { User } from "../models/user.models.js"


const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content}=req.body;

    if(!content){
        throw new ApiError(400,"Content is required");
    }

    const tweet = await Tweet.create({
        content,
        owner:new mongoose.Types.ObjectId(req.user?._id)
    })

    if(!tweet){
        throw new ApiError(400,"Unable to create tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,tweet,"Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userTweets=await Tweet.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        }
    ])

    console.log(userTweets);

    if(!userTweets){
        throw new ApiError(400,"Error fetching user tweets")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,userTweets,"User tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId}=req.params;

    if(!tweetId){
        throw new ApiError(400,"Tweet Id is required")
    }
    const {content}=req.body;

    if(!content){
        throw new ApiError(400,"Content is required")
    }

    const tweet=await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content
            }
        },
        {
            new:true
        }
    )

    if(!tweet){
        throw new ApiError(400,"Error in updating tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,tweet,"Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const {tweetId}=req.params;

    if(!tweetId){
        throw new ApiError(400,"Tweet Id is required")
    }

    const {deletedCount}=await Tweet.deleteOne({
        _id:tweetId
    })

    if(deletedCount===0){
        throw new ApiError(400,"Error deleting the tweet from database")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}