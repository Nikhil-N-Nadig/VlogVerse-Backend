import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt, { decode } from "jsonwebtoken"
import { User } from "../models/user.models.js";

// _ is used for parameters which is not used
const verifyJWT=asyncHandler(async(req,_,next)=>{

    //The .header i sused in mobiles wherre cookies are not available
    const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")

    if(!token){
        throw new ApiError(401,"UnAuthorized Request")
    }

    const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

    const user=await User.findById(decodedToken?._id).select("-password -refreshToken");

    if(!user){
        throw new ApiError(400,"Invalid access token")
    }

    req.user=user;

    next();
})

export {verifyJWT}