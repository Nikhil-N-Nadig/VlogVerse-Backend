import {Router} from 'express'
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { addComment, deleteComment, getVideoComments, updateComment } from '../controllers/comment.controller.js'

const router=Router()

router.use(verifyJWT)

router.route('/comment/:videoId').post(addComment)

router.route('/comment/:commentId').patch(updateComment).delete(deleteComment)

router.route('/video-comments/:videoId').get(getVideoComments)

export {router}