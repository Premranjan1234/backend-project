import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/likes.modal.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.modal.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"please provide valid videoid")
    }
    const userId = req.user._id;
    const existingLike=await Like.findOne({ video: videoId, likedBy: userId })
    if (existingLike) {
        
        const deletedLike=await Like.deleteOne({ video: videoId, likedBy: userId });
        return res.status(200).json(
            new ApiResponse(200,deletedLike,"video unliked successfully")
        )
       
    } 
        const like=await Like.create({
            video:videoId,
            likedBy:userId
        })

        const recentLikedVideo= await Like.findById(like._id).select(" -tweet -comment");

        if(!recentLikedVideo){
            throw new ApiError(400,"Video not liked by user")
        }
        
        
    
    return res.status(200).json(
        new ApiResponse(200,recentLikedVideo,"video liked successfully")
    )

    
    //TODO: toggle like on video
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"please provide valid commentid")
    }
    const userId = req.user._id;
    const existingLike=await Like.findOne({ comment: commentId, likedBy: userId })
    if (existingLike) {
        
        const deletedLike=await Like.deleteOne({ video: commentId, likedBy: userId });
        return res.status(200).json(
            new ApiResponse(200,deletedLike,"comment unliked successfully")
        )
        
       
    } 
        const like=await Like.create({
            comment:commentId,
            likedBy:userId
        })

        const recentLikedComment= await Like.findById(like._id).select(" -tweet -video");

        if(!recentLikedComment){
            throw new ApiError(400,"Comment not liked by user")
        }
        
        
    
    return res.status(200).json(
        new ApiResponse(200,recentLikedComment,"comment liked successfully")
    )

    
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"please provide valid tweetId")
    }
    const userId = req.user._id;
    const existingLike=await Like.findOne({ tweet:tweetId , likedBy:userId })
    if (existingLike) {
        
        const deletedLike=await Like.deleteOne({ video: tweetId, likedBy: userId });
        return res.status(200).json(
            new ApiResponse(200,deletedLike,"video unliked successfully")
        )
        
    } 
        const like=await Like.create({
            tweet:tweetId,
            likedBy:userId
        })

        const recentLikedTweet= await Like.findById(like._id).select(" -comment -video");

        if(!recentLikedTweet){
            throw new ApiError(400,"Tweet not liked by user")
        }
        
        
    
    return res.status(200).json(
        new ApiResponse(200,recentLikedTweet,"tweet liked successfully")
    )

    
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userLikes=await Like.find({likedBy:userId});
    const videoIds = userLikes.map((like) => like.video);

    if(!videoIds)
    {
        throw new ApiError(401,"No liked videos present")
    }

    const likedVideos= await Video.find({_id:{$in:videoIds}})

    if(!likedVideos)
    {
        throw new ApiError(401,"Server problem video not retrieved")
    }

    return res.status(200).json(
        new ApiResponse(200,likedVideos,"Liked videos retrieved successfully")
    )


    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}