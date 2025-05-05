import { asyncHandler,ApiError,ApiResponse } from "../utils/index.js";
import {Comment} from "../models/comment.models.js"
import mongoose from "mongoose";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!videoId){
        throw new ApiError(400,"Video Id is required")
    }

    const aggregateQuery=Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        },
        {
            $lookup:{
                from:"users",
                as:"owner",
                localField:"owner",
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
            $unwind:'$owner'
        },
        {
            $project:{
                content:1,
                createdAt:1,
                owner:1
            }
        }
        
    ])

    const options={
        page:parseInt(page),
        limit:parseInt(limit)
    }
    const comments=await Comment.aggregatePaginate(aggregateQuery,options)

    if(!comments || comments.docs.length===0){
        return res.status(200).json(new ApiResponse(200,[],"No comments found for this video"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200,comments,"Comments fetched successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content} =req.body
    const {videoId}=req.params

    if(!content){
        throw new ApiError(400,"Content is required")
    }

    if(!videoId){
        throw new ApiError(400,"Video ID is required")
    }

    const comment=await Comment.create({
        content,
        owner:new mongoose.Types.ObjectId(req.user?._id),
        video:new mongoose.Types.ObjectId(videoId)
    })

    if(!comment){
        throw new ApiError(400,"Error creating comment in database")
    }

    return res
    .status(201)
    .json(new ApiResponse(201,comment,"Comment created successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const {content}=req.body
    const {commentId}=req.params

    if(!content){
        throw new ApiError(400,"Content is required")
    }

    if(!commentId){
        throw new ApiError(400,"Comment ID is required")
    }

    const comment =await Comment.findOneAndUpdate(
        {
            _id:commentId,
            owner:req.user?._id
        },
        {
            $set:{
                content
            }
        },
        {
            new:true
        }
    )

    if(!comment){
        throw new ApiError(400,"Error updating comment in database.!!(Owner can only update the comment)")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,comment,"Comment updated successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId}=req.params

    if(!commentId){
        throw new ApiError(400,"Comment ID is required")
    }

    const {deletedCount} =await Comment.deleteOne({
        _id:commentId,
        owner:req.user?._id
    })

    if(deletedCount===0){
        throw new ApiError(400,"Cant find comment to delete. !!( Only owners has access to delete comment)")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}