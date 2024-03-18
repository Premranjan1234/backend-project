import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.modal.js"
import {User} from "../models/users.modal.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    
    
    // Parse limit and page to integers
    page = parseInt(page);
    limit = parseInt(limit);

    // Define the filter object based on query parameters
    const filter = {};
    if (query) {
        
        // Assuming 'query' is for searching by video title or description
        filter.$or = [
            { title: query},// Case-insensitive search
            { description: query }
        ];
    }
    if (userId) {
        // Assuming 'userId' is for filtering videos by user
        filter.owner = userId;
    }
    console.log(filter);

    // Define the sort object based on sortBy and sortType parameters
    const sort = {};
    if (sortBy) {
        sort[sortBy] = sortType === 'desc' ? -1 : 1;
    }
    console.log(sort);

    // Calculate the skip value based on page and limit for pagination
    const skip = (page - 1) * limit;

    try {
        // Fetch videos based on filter, sort, pagination
        const videos = await Video.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit);
            console.log(videos);

        // Count total number of videos (for pagination)
        const totalCount = await Video.countDocuments(filter);

        // Respond with the videos and additional metadata
       return res.status(200).json(new ApiResponse(200,{
            data: {
                videos,
                totalCount,
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit)
            }}
            ,"fetched videos"
        ));
    } catch (error) {
        // Handle error
        res.status(500).json({ success: false, error: 'Server Error' });
    }

    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const userId=req.user?._id;
    const user=await User.findById(userId);
    if(!user)
    {
        throw new ApiError(400,"User not found or not logged in");
    }
    const { title, description,duration} = req.body;
     // 1. Get the video file from the request. Assuming it's in req.file.
     const videoFile = req.files?.videoFile[0]?.path;
     if(!videoFile)
     {
        throw new ApiError(401,"video file is required")
     }
     

     // 2. Upload the video file to Cloudinary.
     const videoCloudinaryUpload =  await uploadOnCloudinary(videoFile);
     
     if(!videoCloudinaryUpload){
        throw new ApiError(402,"Problem occurred while uploading the videos on cloudinary")
     }
     
     
     const thumbnailfile = req.files?.thumbnail[0]?.path;
     if(!thumbnailfile)
     {
        throw new ApiError(401,"thumbnail file is required");
     }

     const thumbnailCloudinaryUpload= await uploadOnCloudinary(thumbnailfile)

     if(!thumbnailCloudinaryUpload){
        throw new ApiError(402,"Problem occured while uploading thumbnail on cloudinary")
     }
     
     // 3. Create a new video document in the database.
     const newVideo = new Video({
         title,
         description,
         videoFile:videoCloudinaryUpload?.url,
         thumbnail:thumbnailCloudinaryUpload?.url,
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
       new ApiResponse(200,savedVideo,"Video saved successfully")
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
      new ApiResponse(200,video,"Video was found successfully")
    )


    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400," Not a valid videoId ")
    }
    const { title, description } = req.body;
    const thumbnail = req.file?.path;
    if(!thumbnail){
        throw new ApiError(400,"Thumbnail is required");
    }
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(400,"Video was not found for updating")
    }
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(400,"you are not authorised to update this video")
    }
    const updatedThumbnail=await uploadOnCloudinary(thumbnail);

    if(!updatedThumbnail){
        throw new ApiError(402,"Error occured while uploading thumbnail on cloudinary.");
    }

    const updatedVideo=await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title,
                description,
                thumbnail:updatedThumbnail?.url
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
       new ApiResponse(200,updatedVideo,"Video updated successfully")
    )



    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400," Not a valid videoId ")
    }
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(400,"Video not found for deleting");
    }
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(400,"you are not authorised to delete this tweet")
    }
    
    const removedVideo=await Video.deleteOne({ _id: videoId });
    if(!removedVideo){
        throw new ApiError(400,"Error occured while deleting video.")
    }
    
    return res.status(200).json(
        new ApiResponse(200,removedVideo,"Video deleted successfully")
     )



    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400," Not a valid videoId ")
    }
    const video = await Video.findById(videoId);
    
    if(!video)
    {
        return new ApiError(400,"Error occured while finding video")
    }
    
    const updatedVideo=await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                isPublished:!video.isPublished
                
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

    return res.status(200).json(
        new ApiResponse(200,updatedVideo,"publish status toggled successfully"))
    })

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}