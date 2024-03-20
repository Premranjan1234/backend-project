import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/users.modal.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'
import mongoose from "mongoose";

const generateAccessAndRefreshToken=async(userId)=>{
    try{
        const user=await User.findById(userId);
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});
        return {accessToken,refreshToken};

    }
    catch(error){
        throw new ApiError(500,"something went wrong while generating access token");
    }
}

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

const loginUser=asyncHandler(async(req,res)=>{
    //req data
    //username or email
    //check user
    //check password
    //access token and refresh token

    const {username,email,password}=req.body;
    console.log(email);
    if(!username && !email)
    {
        throw new ApiError(400, "username or email is required");
    }
    const userData= await User.findOne({
        $or:[{email},{username}]
    })
     console.log(userData)
    if(!userData){
        throw new ApiError(404,"user doesnot exist");
    }
    const isPasswordValid=await userData.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401," password is not valid");
    }
    const {refreshToken,accessToken}=await generateAccessAndRefreshToken(userData._id);
    const loggedInUser=await User.findById(userData._id);
     const options={
        httpOnly:true,
        secure:true
     }
    return res.
    status(200).
    cookie("accessToken",accessToken,options).
    cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,
            {
                user:loggedInUser,refreshToken,accessToken,

            },
            "User logged in successfully"
        )
    )
})
const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
     }
     return res.status(200).
     clearCookie("accessToken",options).
     clearCookie("refreshToken",options).
     json(new ApiResponse(200,{},"user logged out"))
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }
    try{
    const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    const user=await User.findById(decodedToken._id)
    if(!user)
    {
        throw new ApiError(401,"invalid refresh token")
    }
    if(incomingRefreshToken !== user?.refreshToken)
    {
        throw new ApiError(401, "refresh token expired u cannot login")
    }
    const {accessToken,newrefreshToken}=await generateAccessAndRefreshToken(user._id)
    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200).
     cookie("accessToken",accessToken,options).
     cookie("refreshToken",newrefreshToken,options).
     json(new ApiResponse(200,{
        accessToken,refreshToken:newrefreshToken
     },"access token refreshed"))
    }
    catch(error){
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }


})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body
    const user= await User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect)
    {
        throw new ApiError(400,"Invalid old password")
    }
    user.password=newPassword;
    await user.save({validateBeforeSave:false})

    return res.status(200).
    json(new ApiResponse(200,{}," password changed successfully"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    
    return res.status(200).
    json(new ApiResponse(200,req.user,"current user fetched successfully"));
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body
    if(!fullName || !email)
    {
        throw new ApiError(400,"user detail is required")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
               fullName,
               email:email
            }
        },
        {
             new:true
        }

        ).select("-password")

        return res.status(200).
        json( new ApiResponse(200,user,"User updated successfully"))
})

const updateAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"avatar url not found")
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,"avatar not uploaded on cloudinary")

    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200).
    json(new ApiResponse(200,user,"avatar is updated"))

})
const updateCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"avatar url not found")
    }
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400,"avatar not uploaded on cloudinary")

    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200).
    json(new ApiResponse(200,user,"coverImage is updated"))


})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
     const {username}=req.params;
     if(!username?.trim())
     {
        throw new ApiError(400,"username is required")
     }
     const channel=await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            },
            
            
        },
        {
            
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"subscriber",
                    as:"subscribedTo"
                }
            
        },
        {
            $addFields:{
                subscribersCount:{
                     $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
           $project:{
              fullName:1,
              username:1,
              email:1,
              avatar:1,
              coverImage:1,
              subscribersCount:1,
              channelsSubscribedToCount:1,
              isSubscribed:1


           }
        }
     ])
     if(!channel)
     {
        throw new ApiError(400," channel doesnot exist")
     }
     return res.status(200).
     json( new ApiResponse(200,channel[0],"user chhanel fetched succesfully"))

})
const getWatchHistory=asyncHandler(async(req,res)=>{
     const users=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)

            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    },
                                    
                                    
                                }
                            ]

                        }
                    },
                    {
                        
                            $addFields:{
                                owner:{
                                $first:"$owner"
                            }
                        }
                        
                    }
                ]
            }
        }
     ])

     return res.status(200).
     json( new ApiResponse(200,users[0].watchHistory,"watch history fetched succesfully"))
})




export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
}
