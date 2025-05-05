import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { getAllVideos,getVideoById,updateVideoDetails,updateVideoThumbnail,publishAVideo,togglePublishStatus,deleteVideo } from "../controllers/video.controller.js";

const router=Router()
router.use(verifyJWT) //Applies for all routes

router.route('/publish-video').post(
    upload.fields([
        {
            name:'videoFile',
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
    ]),
    publishAVideo);

router.route('/get-all-videos').get(getAllVideos);
// http://localhost:5000/api/videos?page=2&limit=6&query=funny&sortBy=views&sortType=desc&userId=663432cfa9177237c55a74b3


router.route('/get-video/:videoId').get(getVideoById);

router.route('/update-video-details/:videoId').patch(updateVideoDetails)

router.route('/update-video-thumbnail/:videoId').patch(
    upload.single("thumbnail"),
    updateVideoThumbnail
)

router.route('/video-status/:videoId').patch(togglePublishStatus)

router.route('/delete-video/:videoId').delete(deleteVideo)

export {router}