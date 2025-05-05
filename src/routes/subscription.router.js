import {Router} from 'express'
import {verifyJWT} from '../middlewares/auth.middleware.js'
import { getSubscribedChannels, getUserChannelSubscribers, isSubscribed, toggleSubscription } from '../controllers/subscription.controller.js'

const router=Router()

router.use(verifyJWT)

router.route('/subscribe/:channelId').post(toggleSubscription)

router.route('/subscribers/:channelId').get(getUserChannelSubscribers)

router.route('/subscribed-channels/:subscriberId').get(getSubscribedChannels)

router.route('/isSubscribed/:channelId').get(isSubscribed)

export {router}