import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"
import dotenv from "dotenv"

dotenv.config({
    path:'./.env'
})

const connection=async ()=>{
    try {
        const connectionData=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)        
        console.log("Connected Sucessfully to the host ",connectionData.connection.host)
    } catch (error) {
        console.log("Error Occured while connecting DB ",error)
    }

}

export default connection;