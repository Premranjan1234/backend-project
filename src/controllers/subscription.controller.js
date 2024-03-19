import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/users.modal.js"
import { Subscription } from "../models/subscription.modal.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"please provide valid channelId")
    }
    const userId=req.user?._id;
    console.log(userId) // Assuming user ID is available in req.user

    // Check if the channel exists
    const channelExists = await User.exists({ _id: channelId });
    if (!channelExists) {
        throw new ApiError(404, "Channel not found");
    }

    // Check if the user is already subscribed to the channel
    const isSubscribed = await Subscription.exists({ subscriber:userId, channel:channelId });

    // Toggle subscription
    if (isSubscribed) {
        // If already subscribed, unsubscribe
        const toggleSubscribe=await Subscription.deleteOne({ subscriber:userId, channel:channelId });
        res.status(200).json
        (new ApiResponse(200,toggleSubscribe,"Unsubscribed successfully"));
    } else {
        // If not subscribed, subscribe
        const toggleSubscribe= await Subscription.create({ subscriber: userId, channel: channelId });
        res.status(200).json(
            new ApiResponse(
                200,toggleSubscribe,"Subscribed successfully"
                ));
    }
    
    // TODO: toggle subscription
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} =req.params;
    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"please provide valid channelId")
    }

    // Get subscribers of the channel
    const subscribers = await Subscription.find({ channel:channelId }).populate("subscriber", "username fullName");

    res.status(200).json(
        new ApiResponse(200,subscribers, "Subscribers fetched successfully"));

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    
    const { subscriberId } = req.params;
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"please provide valid subscriberId")
    }

    // Get channels subscribed by the user
    const subscribedChannels = await Subscription.find({ subscriber: subscriberId }).populate("channel", "username fullName");

    res.status(200).json(new ApiResponse(200,subscribedChannels, "Subscribed channels fetched successfully"));
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}