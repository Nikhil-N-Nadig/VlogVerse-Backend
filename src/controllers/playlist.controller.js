import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import { asyncHandler,ApiError,ApiResponse } from "../utils/index.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist

    const userId=new mongoose.Types.ObjectId(req.user?._id)

    if(!(name && description)){
        throw new ApiError(400,"All fields are required")
    }

    const playlist=await Playlist.findOne({
        name,
        description,
        owner:userId
    })

    if(playlist){
        throw new ApiError(200,`Already playlist ${name} exists. Cant create new playlist with same name.`)
    }

    const new_playlist=await Playlist.create({
        name,
        description,
        owner:userId
    })

    if(!new_playlist){
        throw new ApiError(400,"Error creating Playlist")
    }

    return res
    .status(201)
    .json(new ApiResponse(200,new_playlist,"Playlist created successfully"))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    let {userId} = req.params
    //TODO: get user playlists

    if(!userId){
        throw new ApiError(400,"UserId is required")
    }

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"User ID format is invalid")
    }

    userId=new mongoose.Types.ObjectId(userId);

    const playlists=await Playlist.aggregate([
        {
            $match:{
                owner:userId
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:'videos',
                pipeline:[
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
                        $project:{
                            _id:1,
                            videoFile:1,
                            thumbnail:1,
                            title:1,
                            description:1,
                            duration:1,
                            views:1,
                            owner:1
                        }
                    }
                ]
            }
        },
        {
            $project:{
                _id:1,
                name:1,
                description:1,
                videos:1
            }
        }
    ])

    if(!playlists || playlists.length===0){
        return res.status(200).json(new ApiResponse(200,[],"No playlists found"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200,playlists,"User playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    let {playlistId} = req.params
    //TODO: get playlist by id

    if(!playlistId){
        throw new ApiError(400,"Playlist ID is required")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Playlist ID is not valid")
    }

    playlistId=new mongoose.Types.ObjectId(playlistId)

    const playlist=await Playlist.aggregate([
        {
            $match:{
                _id:playlistId
            }
        },
        {
            $lookup:{
                from:'videos',
                as:'videos',
                localField:'videos',
                foreignField:'_id'
            }
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
            $unwind:'$owner'
        }
    ])

    if(!playlist || playlist.length===0){
        throw new ApiError(400,"Playlist not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!(playlistId && videoId)){
        throw new ApiError(400,"Playlist Id and Video Id is required")
    }

    if(!(isValidObjectId(playlistId) && isValidObjectId(videoId))){
        throw new ApiError(400,"ID format is not valid")
    }

    const playlist=await Playlist.findOneAndUpdate(
        {
            _id:new mongoose.Types.ObjectId(playlistId),
            owner:new mongoose.Types.ObjectId(req.user?._id)
        },
        {
            $addToSet:{
                videos:videoId
            }
        },
        {
            new:true
        }
    )

    if(!playlist){
        throw new ApiError(400,"Error adding video into playlist (Only owners can add video to playlist)")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Video added into playlist successfully"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if(!(playlistId && videoId)){
        throw new ApiError(400,"Playlist Id and Video Id is required")
    }

    if(!(isValidObjectId(playlistId) && isValidObjectId(videoId))){
        throw new ApiError(400,"ID format is not valid")
    }

    const playlist= await Playlist.findOneAndUpdate(
        {
            _id:new mongoose.Types.ObjectId(playlistId),
            owner:new mongoose.Types.ObjectId(req.user?._id)
        },
        {
            $pull:{
                videos:videoId
            }
        },
        {
            new:true
        }
    )

    if(!playlist){
        throw new ApiError(400,"Error removing video (Only owners can add video to playlist)")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Video removed from playlist successfully"))


})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError("Valid playlist Id is required")
    }

    const playlist=await Playlist.findOneAndDelete(
        {
            _id:playlistId,
            owner:new mongoose.Types.ObjectId(req.user?._id)
        }
    )

    if(!playlist){
        throw new ApiError(400,"Error deleting Playlist (Only owners can delete playlist)")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!(name && description)){
        throw new ApiError(400,"All fields are required")
    }

    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError(400,"Valid playlist id is required");
    }

    const playlist = await Playlist.findOneAndUpdate(
        {
            _id:new mongoose.Types.ObjectId(playlistId),
            owner:new mongoose.Types.ObjectId(req.user?._id)
        },
        {
            $set:{
                name,
                description
            }
        }
    )

    if(!playlist){
        throw new ApiError(400,"Error while updating playlist (Only owners can update playlist)")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Playlist updated successfully"))
    
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}