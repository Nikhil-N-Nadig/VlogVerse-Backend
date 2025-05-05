import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'
import { ApiError } from './ApiError.js';
cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const cloudinaryFileUpload=async (uploadFilePath)=>{
    try {
        if(!uploadFilePath) return null;
        const response=await cloudinary.uploader.upload(
            uploadFilePath,
            {
                resource_type:'auto'
            }
        )
        console.log("File uploaded successfully ",response.url)
        fs.unlinkSync(uploadFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(uploadFilePath);
    }
}

const cloudinaryFileDestroy=async(fileUrl)=>{
    try{
        if(!fileUrl){
            return null;
        }

        const urlParts = fileUrl.split('/');
        const fileWithExtension = urlParts[urlParts.length - 1];
        const publicId = fileWithExtension.split('.')[0];

        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    }
    catch{
        throw new ApiError(400,"Cant destroy error");
    }
}
const cloudinaryVideoDestroy=async(fileUrl)=>{
    try{
        if(!fileUrl){
            return null;
        }

        const urlParts = fileUrl.split('/');
        const fileWithExtension = urlParts[urlParts.length - 1];
        const publicId = fileWithExtension.split('.')[0];

        const result = await cloudinary.uploader.destroy(publicId,{
            resource_type:'video'
        });
        return result;
    }
    catch{
        throw new ApiError(400,"Cant destroy error");
    }
}

export {cloudinaryFileUpload,cloudinaryFileDestroy,cloudinaryVideoDestroy}