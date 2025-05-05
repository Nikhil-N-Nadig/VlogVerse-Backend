class ApiError extends Error{
    constructor(
        statusCode,
        message="something went wrong",
        errors=[],
        stack=""
    ){
        //For Super(message) The message property of Error is set, so console.log(new ApiError(500).message) will print "something went wrong".
        super(message)
        this.statusCode=statusCode,
        this.message=message,
        this.errors=errors,
        this.data=null,
        this.success=false
        if(stack){
            this.stack=stack;
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}