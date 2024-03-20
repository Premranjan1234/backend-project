import mongoose from "mongoose"
import {Video} from "../models/video.modal.js"
import {Subscription} from "../models/subscription.modal.js"
import {Like} from "../models/likes.modal.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user._id;// Assuming channelId is obtained from user authentication
         // Fetch total video views
        const totalVideoViews = await Video.aggregate([
            { $match: { owner:channelId } },
            { $group: { _id:null, totalViews: { $sum: "$views" } } }
        ]);

        // Fetch total subscribers
        const totalSubscribers = await Subscription.countDocuments({ channel: channelId });
        
        // Fetch total videos
        const totalVideos = await Video.countDocuments({ owner: channelId });
        
        const userVideos=await Video.find({owner:channelId});
        // Fetch total video likes
        const videoIds = userVideos.map(video => video._id);
        const totalVideoLikes = await Like.countDocuments({ video: { $in: videoIds } });

        

        return res.status(200).json(new ApiResponse(200, {
            data: {
                totalVideoViews: totalVideoViews || 0,
                totalSubscribers,
                totalVideos,
                totalVideoLikes: totalVideoLikes || 0
            }
        }, "Channel statistics fetched successfully"));
    
    
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user._id; // Assuming channelId is obtained from user authentication

    
        // Fetch all videos uploaded by the channel
        const videos = await Video.find({ owner: channelId });
         console.log(videos);
        return res.status(200).json(new ApiResponse(200, {
            data:videos
        }, "Channel videos fetched successfully"));
    // TODO: Get all the videos uploaded by the channel
})

export {
    getChannelStats, 
    getChannelVideos
    }