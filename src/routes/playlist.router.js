import { Router } from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from '../controllers/playlist.controller.js'

const router = Router()

router.use(verifyJWT)

router.route('/playlist').post(createPlaylist)


router.route('/playlist/:playlistId').get(getPlaylistById)
                        .patch(updatePlaylist)
                        .delete(deletePlaylist)

router.route('/playlist-video/:playlistId/:videoId').post(addVideoToPlaylist)
                                                    .delete(removeVideoFromPlaylist)

router.route('/user-playlists/:userId').get(getUserPlaylists)

export {router}
