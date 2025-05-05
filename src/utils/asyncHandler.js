
//The backend functions received is called functionReceived

//We can handle it in 2 ways

//One using Promise
//Higher Order Function
const asyncHandler=(functionRecived)=>((req,res,next)=>{
    return Promise.resolve(functionRecived(req,res,next)).catch((error)=>{
        next(error)
    })
})

//Second by using try catch block

const asyncHandler1=(functionReceived)=>async (req,res,next)=>{
    try{
        await functionReceived(req,res,next);
    }
    catch(error){
        res.status(error.code||500).json({
            status:false,
            message:error.message
        })
    }
}   

export {asyncHandler}