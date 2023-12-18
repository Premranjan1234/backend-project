import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/users.modal.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";



const registerUser= asyncHandler(async(req,res)=>{
    //get user detail from frontend
    //validation-not empty
    //check if user already exists:username,email
    //check for images ,check for avatar
    //upload them to cloudinary
    //create user object-create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res
    const {fullName,email,username,password}=req.body
     if(fullName===''){
     throw new ApiError(400,"fullName is reqiured")
     }
     if(email===''){
        throw new ApiError(400,"email is reqiured")
    }
    if(username===''){
        throw new ApiError(400,"username is reqiured")
    }
    if(password===''){
        throw new ApiError(400,"password is reqiured")
    }
    const existedUser= await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(401,"User with username or email already exist")
    }
    //console.log(req.files);
    const avatarLocalPath=req.files?.avatar[0]?.path;
    //console.log(avatarLocalPath);
    //const coverImageLocalPath=req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path;
    }
    //console.log(coverImageLocalPath);
    if(!avatarLocalPath)
    {
        throw new ApiError(402,"Avatar file is required")
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    
    
    //console.log(avatar);
    if(!avatar)
    {
        throw new ApiError(403,"Avatar file is required")
    }
    const user=await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url||"",
        email,
        password,
        username:username.toLowerCase()
    })
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering user")
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registered successfully")
    )




})

export {registerUser}