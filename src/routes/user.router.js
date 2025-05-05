import { Router } from "express";
import { login, logout, register,refreshAccessTokens, changeUserPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelInfo, getUserWatchHistory, deleteUserAccount } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router=Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    register
)

router.route("/login").post(login) //Checked

router.route("/logout").post(verifyJWT,logout) //Checked

router.route('/refresh-token').post(refreshAccessTokens) //Checked

router.route('/change-password').post(verifyJWT,changeUserPassword) 

router.route('/current-user').get(verifyJWT,getCurrentUser)

router.route('/update-account').patch(verifyJWT,updateAccountDetails)

router.route('/update-avatar').patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar
)

router.route('/update-cover-image').patch(
    verifyJWT,
    upload.single("coverImage"),
    updateUserCoverImage
)

router.route('/channel-info/:username').get(verifyJWT,getUserChannelInfo)

router.route('/watch-history').get(verifyJWT,getUserWatchHistory)

router.route('/delete-account').delete(verifyJWT,deleteUserAccount)

export  {router};