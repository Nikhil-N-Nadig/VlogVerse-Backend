import mongoose from "mongoose";
import { ApiError, ApiResponse, asyncHandler } from "../utils/index.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.models.js";


const updateViewsAndHistory = asyncHandler(async(req,res,next)=>{
    
    const userId = new mongoose.Types.ObjectId(req.user?._id);

    let {videoId} = req.params;

    if(!videoId){
        throw new ApiError(400,"VideoId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    videoId=new mongoose.Types.ObjectId(videoId)

    const updateVideoViews=await Video.findByIdAndUpdate(
            videoId,
        {
            $inc:{
                views:1
            }
        },
        {
            new:true
        }
    )

    if(!updateVideoViews){
        throw new ApiError(400,"Error updating videocount")
    }

    // Pull (remove) the videoId if it already exists
    await User.findByIdAndUpdate(userId, {
        $pull: { watchHistory: videoId }
    });
  
    const updateUserWatchHistory = await User.findByIdAndUpdate(
        userId,
        {
        $push: { watchHistory: videoId }
        },
        { new: true }
    );
  

    if(!updateUserWatchHistory){
        throw new ApiError(400,"Error updating the user watch history")
    }

    next();

})

export {updateViewsAndHistory}