import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content}=req.body;
    const userId=req.user?._id;
    if(!content){
        throw new ApiError(400,"tweet is required")
    }
    const tweet=await Tweet.create({
        content,
        owner:userId
        
    })
    const createdTweet=await Tweet.findById(tweet._id).select();
    if(!createdTweet){
        throw new ApiError(500,"Something went wrong while created tweet")
    }
    return res.status(201).json(
        new ApiResponse(200,createdTweet,"Tweet created  successfully")
    )



})

const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const tweets = await Tweet.find({ user: userId }).populate('user', 'owner');
    return res.status(201).json(
        new ApiResponse(200,tweets,"Tweet created successfully")
    )
    // TODO: get user tweets
})

const updateTweet = asyncHandler(async (req, res) => {
      const { newtweet } = req.body;
      const tweetId = req.params.tweetId;
    
      const updatedTweet=await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content:newtweet
            }
        },
        {new:true}
    ).select("-owner")
    return res.status(201).json(
        new ApiResponse(200,updatedTweet,"Tweet created  successfully")
    )


    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    const tweetId = req.params.tweetId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400," Not a valid tweetId ")
    }
    const tweet = await Tweet.findById(tweetId);
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(400,"you are not authorised to delete this tweet")
    }

    await tweet.remove();


    
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}