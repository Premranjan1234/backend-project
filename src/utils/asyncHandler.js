const asyncHandler=(requestHandler)=>{
     (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
     }
}

export {asyncHandler}

/*
const asyncHandler=(requestHandler)=>(fn)=>async(req,res,next){
    try{
        await fn(req,res,next)
    }catch(error){
        
    }
}
*/