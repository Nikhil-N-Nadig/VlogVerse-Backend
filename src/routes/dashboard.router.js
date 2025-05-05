import { Router } from 'express'
import {verifyJWT} from '../middlewares/auth.middleware.js'
import { updateViewsAndHistory } from '../middlewares/updateViewsAndHistory.middleware.js'
import { getChannelStats, getChannelVideos, watchVideo } from '../controllers/dashboard.controller.js'
const router=Router()

router.use(verifyJWT)

router.route("/video/:videoId").get(updateViewsAndHistory,watchVideo)

router.route("/channel-videos").get(getChannelVideos)

router.route("/channel-status").get(getChannelStats)

export {router}