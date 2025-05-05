import connection from "./db/connection.js";
import { app } from "./app.js";

connection()
.then((con)=>{
    app.listen(process.env.PORT|| 8000,(req,res)=>{
        console.log("Connection established with ",process.env.PORT)
    })    
})
.catch((error)=>{
    console.log("Error Occured while connection: ",error)
})


