import {Router} from 'express'
import {verifyJWT} from '../middlewares/auth.middleware.js'
import { getCommentLikecount, getCommentLikes, getLikedTweets, getLikedVideos, getTweetLikecount, getTweetLikes, getVideoLikecount, getVideoLikes, toggleCommentLike, toggleTweetLike, toggleVideoLike } from '../controllers/like.controller.js'

const router=Router()

router.use(verifyJWT)

router.route('/like-video/:videoId').post(toggleVideoLike)

router.route('/like-comment/:commentId').post(toggleCommentLike)

router.route('/like-tweet/:tweetId').post(toggleTweetLike)

router.route('/liked-videos').get(getLikedVideos)

router.route('/liked-tweets').get(getLikedTweets)

router.route('/video-likes/:videoId').get(getVideoLikes)

router.route('/comment-likes/:commentId').get(getCommentLikes)

router.route('/tweet-likes/:tweetId').get(getTweetLikes)

router.route('/tweet-likecount/:tweetId').get(getTweetLikecount)

router.route('/comment-likecount/:commentId').get(getCommentLikecount)

router.route('/video-likecount/:videoId').get(getVideoLikecount)

export {router}

