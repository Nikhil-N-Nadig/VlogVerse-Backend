import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"


const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}
))

app.use(express.json({limit:"16kb"}))

app.use(express.static("public"))

app.use(cookieParser())

app.use(express.urlencoded({
    extended:true,
    limit:"16kb"
}))

import {router as userRouter}  from "./routes/user.router.js"
import {router as videoRouter} from "./routes/video.router.js"
import {router as tweetRouter} from "./routes/tweet.router.js"
import {router as subscriptionRouter} from "./routes/subscription.router.js"
import {router as commentRouter} from "./routes/comment.router.js"
import {router as likeRouter} from "./routes/like.router.js"
import {router as playlistRouter} from "./routes/playlist.router.js"
import {router as dashboardRouter} from "./routes/dashboard.router.js"

app.use("/api/v1/users",userRouter)
app.use("/api/v1/videos",videoRouter)
app.use("/api/v1/tweets",tweetRouter)
app.use("/api/v1/subscriptions",subscriptionRouter)
app.use("/api/v1/comments",commentRouter)
app.use("/api/v1/likes",likeRouter)
app.use("/api/v1/playlists",playlistRouter)
app.use("/api/v1/dashboard",dashboardRouter)
export {app}