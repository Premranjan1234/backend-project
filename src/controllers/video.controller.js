import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.modal.js"
import {User} from "../models/users.modal.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    
    
    // Parse limit and page to integers
    page = parseInt(page);
    limit = parseInt(limit);

    // Define the filter object based on query parameters
    const filter = {};
    if (query) {
        // Assuming 'query' is for searching by video title or description
        filter.$or = [
            { title: { $regex: query, $options: 'i' } }, // Case-insensitive search
            { description: { $regex: query, $options: 'i' } }
        ];
    }
    if (userId) {
        // Assuming 'userId' is for filtering videos by user
        filter.userId = userId;
    }

    // Define the sort object based on sortBy and sortType parameters
    const sort = {};
    if (sortBy) {
        sort[sortBy] = sortType === 'desc' ? -1 : 1;
    }

    // Calculate the skip value based on page and limit for pagination
    const skip = (page - 1) * limit;

    try {
        // Fetch videos based on filter, sort, pagination
        const videos = await Video.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        // Count total number of videos (for pagination)
        const totalCount = await Video.countDocuments(filter);

        // Respond with the videos and additional metadata
        res.status(200).json({
            success: true,
            data: {
                videos,
                totalCount,
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        // Handle error
        res.status(500).json({ success: false, error: 'Server Error' });
    }

    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description,duration} = req.body
     // 1. Get the video file from the request. Assuming it's in req.file.
     const videoFile = req.file?.path;
     const userId = req.user._id;

     // 2. Upload the video file to Cloudinary.
     const videoCloudinaryUpload =  await uploadOnCloudinary(videoFile);
     const thumbnailfile = req.file?.path;

 
     // 3. Create a new video document in the database.
     const newVideo = new Video({
         title,
         description,
         videoUrl: videoCloudinaryUpload?.url,
         thumbnail:thumbnailfile?.url,
         owner:userId,
         duration
          // URL of the uploaded video
          // ID of the uploaded video on Cloudinary (optional)
     });
 
     // Save the new video document to the database.
     const savedVideo = await newVideo.save();

     if(!savedVideo){
        throw new ApiError(400,"Error ocurred while saving the video")
     }
 
     // Respond with the newly created video.
     
     return res.status(200).json(
        ApiResponse(200,savedVideo,"Video saved successfully")
     )
 
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400," Not a valid videoId ")
    }
    const video=await Video.findById(videoId);

    if(!video){
        throw new ApiError(400,"Video was not found")
    }

    return res.status(200).json(
        ApiResponse(200,video,"Video was found successfully")
    )


    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400," Not a valid videoId ")
    }
    const { title, description,thumbnail } = req.body;

    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(400,"Video was not found for updating")
    }
    const updatedThumbnail=await uploadOnCloudinary(thumbnail)

    const updatedVideo=await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title,
                description,
                thumbnail:updatedThumbnail
            }
        },
        {
            new:true
        }
    )
    if(!updatedVideo){
        throw new ApiError(400,"error occured while updating video")
    }

    return res.status(200).json(
        ApiResponse(200,updatedVideo,"Video updated successfully")
    )



    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400," Not a valid videoId ")
    }
    const video = await Video.findById(videoId);
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(400,"you are not authorised to delete this tweet")
    }
    await video.remove();



    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400," Not a valid videoId ")
    }
    const video = await Video.findById(videoId);
    
    const updatedVideo=await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                isPublished:!isPublished
                
            }
        },
        {
            new:true
        }
    )
    if(!updatedVideo)
    {
        throw new ApiError(400,"error occured while toggling publish status ")
    }

    return res.status(200).json(200,updatedVideo,"publish status toggled successfully")


})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}