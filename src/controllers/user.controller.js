import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { User } from '../models/user.models.js';
import {cloudinaryFileDestroy, cloudinaryFileUpload} from "../utils/cloudinary.js"
import jwt from 'jsonwebtoken'
import mongoose, { Mongoose } from 'mongoose';

const generateAccessandRefreshTokens=async(userId)=>{

    try {
        const user=await User.findById(userId);

    if(!user){
        throw new ApiError(400,"Wrong UserId");
    }

    const accessToken=user.generateAccessToken();
    const refreshToken=user.generateRefreshToken();

    user.refreshToken=refreshToken;
    await user.save({validateBeforeSave:false});

    return {accessToken,refreshToken};
    } 
    catch (error) {
        throw new ApiError(404,"Something went wrong while generating access and refresh tokens")
    }
}

const register=asyncHandler(async (req,res)=>{

    //STEPS TO PERFFORM
    //Take the inputs of the fields
    //Check if all fields are there
    //Check if username or email already exists 
    //Check for files
    //Upload files into cloudinary 
    //Create an User instance
    //Return response

    //Take the inputs of the fields
    const {fullName,username,email,password}=req.body;
    // console.log("The re.body has data: ",req.body)

    //Check if all fields are there
    if(
        [fullName,username,email,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required");
    }

    //Check if username or email already exists 
    const existing_user=await User.findOne({$or:[
        { username },{ email }]
    })

    if(existing_user){
        throw new ApiError(400,"Username or Email already exists")
    }

    //Check for files
    const avatarLocalPath = req.files?.avatar[0]?.path

    //This is not handling error properly as we are not checking that cover image is present in res.files or not
    //So use other technique
    // const coverImageLocalPath =req.files?.coverImage[0].path
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath =req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
    }
    // console.log("Avatar Local Path: ",avatarLocalPath)

    //Upload files into cloudinary 
    const avatar=await cloudinaryFileUpload(avatarLocalPath)
    const coverImage=await cloudinaryFileUpload(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(500,"Something went wrong while uploading to Cloud");
    }

    // console.log("Avatar data from cloudinary: ",avatar)
    // if(coverImage){
    //     console.log("CoverImage data from cloudinary: ",coverImage)
    // }

    //Create an User instance
    const user = await User.create({
        username:username.toLowerCase(),
        email,
        password,
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
    })

    // if(user){
    //     console.log("User: ",user)
    // }
    const createdUser=await User.findById(user._id).select( 
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while creating a model");
    }

    // console.log("Created user: ",createdUser);

    //Return response
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered sucessfully")
    )

})

const login=asyncHandler( async (req,res)=>{

    //Get data from req
    //Check validations
    //Check Password
    //Get the user from the data
    //Generate the access and refresh tokes for them 
    //return data

    // console.log(req.body)

    const { username,email,password }=req.body;

    if((!username && !email) || !password){
        throw new ApiError(400,"Username or email and password is required")
    }

    const user=await User.findOne(
        {$or:[{username},{email}]}
    )

    if(!user){
        throw new ApiError(404,"User with given credentials doesn't exist");
    }

    const isPasswordCorrect=await user.isPasswordCorrect(password)

    if(!isPasswordCorrect){
        throw new ApiError(401,"Wrong User Credentials")
    }

    const {accessToken,refreshToken} = await generateAccessandRefreshTokens(user._id);

    const loggedUser=await User.findById(user._id).select("-password -refreshToken");

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    )
})

const logout=asyncHandler(async(req,res)=>{
    // console.log(req.user._id)
    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }

    res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,user.username,"User Logged Out Successfully"))
})

const refreshAccessTokens=asyncHandler(async(req,res)=>{
    const inputRefreshToken=req.cookies?.refreshToken || req.body?.refreshToken //For mobiles

    // console.log(req.cookies)

    if(!inputRefreshToken){
        throw new ApiError(400,"Unauthorized Access")
    }

    try {
        const decodedToken=jwt.verify(inputRefreshToken,process.env.REFRESH_TOKEN_SECRET)

        const user=await User.findById(decodedToken?._id);

        if(!user){
            throw new ApiError(400,"No refresh tokens")
        }

        if(user?.refreshToken!=inputRefreshToken){
            throw new ApiError(400,"Refresh Tokenn Already Expired")
        }

        const {accessToken,refreshToken}=await generateAccessandRefreshTokens(user?._id);

        user.refreshToken=refreshToken;
        user.save({validateBeforeSave:false})

        const options={
            httpOnly:true,
            secure:true
        }

        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(200,{
                accessToken,refreshToken
            },"Access token refreshed successfully"),
        )
    } catch (error) {
        throw new ApiError(400,error?.message||"Something went wrong in refreshing access token")   
    }

})

const changeUserPassword=asyncHandler(async(req,res)=>{

    const {oldPassword,newPassword}=req.body;

    if(oldPassword===newPassword){
        throw new ApiError(400,"New password can't be same as old password")
    }

    const user=await User.findById(req.user?._id)

    if(!user){
        throw new ApiError(401,"User doesn't exist")
    }

    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid current password")
    }

    user.password=newPassword;
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"));
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"Current user fetched sucessfully"))
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email,}=req.body;

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required");
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email:email
            }
        },
        {
            new:true //returns the updated data
        }
    )

    return res
            .status(200)
            .json(new ApiResponse(200,user,"Fields updated Sucessfully"))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar field is required")
    }

    const avatar=await cloudinaryFileUpload(avatarLocalPath)

    if(!avatar.url){
        return new ApiError(400,"Error uploading avatar")
    }

    const {result} =await cloudinaryFileDestroy(req.user.avatar);

    if(result!=='ok'){
        console.warn("Failed to delete old avatar from Cloudinary");
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken")

    return res
            .status(200)
            .json(new ApiResponse(200,user,"Avatar updated successfully"))
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400,"CoverImage field is required")
    }

    const coverImage=await cloudinaryFileUpload(coverImageLocalPath)

    if(!coverImage.url){
        return new ApiError(400,"Error uploading coverImage")
    }

    const {result} =await cloudinaryFileDestroy(req.user?.coverImage);

    if(result!=='ok'){
        console.warn("Failed to delete old coverImage from Cloudinary");
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken")

    return res
            .status(200)
            .json(new ApiResponse(200,user,"CoverImage updated successfully"))
})

const getUserChannelInfo=asyncHandler(async(req,res)=>{
    const {username}=req.params

    if(!username){
        throw new ApiError(400,"Cant get Username")
    }

    const channel=await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                as: "Subscribers",
                localField: "_id",
                foreignField: "channel"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                as: "SubscribedTo",
                localField: "_id",
                foreignField: "subscriber"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$Subscribers"
                },
                subscribedToCount:{
                    $size:"$SubscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{
                            $in:[req.user?._id,"$Subscribers.subscriber"],
                        },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                username:1,
                fullName:1,
                email:1,
                subscribersCount:1,
                subscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1
            }
        }
    ])

    if(!channel?.length>0){
        throw new ApiError(404,"Error getting channel information")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"Channel info fetched successfully"))
})

const getUserWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{_id:new mongoose.Types.ObjectId(req.user?._id)}
        },
        {
            $lookup:{
                from:"videos",
                as:"watchHistory",
                localField:"watchHistory",
                foreignField:"_id",
                pipeline:[
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
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    if(!user?.length>0){
        return new ApiError(404,"Error while fetching user watchHistory")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"User WatchHistory fetched successfully"))

})

const deleteUserAccount=asyncHandler(async(req,res)=>{
    
    const user=await User.findById(
        req.user?._id
    )

    if(!user){
        throw new ApiError(400,"User not found")
    }

    if(user?.avatar){
        const {result}=await cloudinaryFileDestroy(user?.avatar)
        if(result!=='ok'){
            console.warn("Failed to delete avatar from cloudinary")
        }
    }

    if(user?.coverImage){
        const {result}=await cloudinaryFileDestroy(user?.coverImage);
        if(result!=='ok'){
            console.warn("Failed to delete coverImage from cloudinary")
        }
    }

    const {deletedCount}=await User.deleteOne({
        _id:user._id
    })

    if(deletedCount==0){
        throw new ApiError(400,"Failed to delete user from database")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{},"User Account deleted successfully"))
})


export {register,login,logout,refreshAccessTokens,changeUserPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage,getUserChannelInfo,getUserWatchHistory,deleteUserAccount} 