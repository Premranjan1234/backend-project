import mongoose from "mongoose"
import {Comment} from "../models/comments.modal.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.modal.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!videoId)
    {
        throw new ApiError(400,"Videoid is required")
    }
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
      };
      const pipeline = [
        {
          $match: {
            video: mongoose.Types.ObjectId(videoId),
          },
        },
        {
            $project:{
                content:1,
                owner:1
        }}
        // Add other stages to the pipeline if needed
      ];
      const result = await Comment.aggregatePaginate(pipeline, options);

      
      if(!result){
        throw new ApiError(500,"pagination result not found")
      }

      return res.status(200).
     json( new ApiResponse(200,result,"comments fetched successfully"))

    


})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { text } = req.body;
    const foundvideo = await Video.findById(videoId);
      if (!foundvideo) {
        throw new ApiError(400,"video not found")
      }
    
      const comment=await Comment.create({
        video:videoId,
        content:text,
        owner:req.user?._id
    })
    if(!comment)
    {
        throw new ApiError(400,"comment not created successfully")
    }
    const createdComment=await Comment.findById(user).select("-owner -video ")

    return res.status(200).
     json( new ApiResponse(200,createdComment,"comments fetched successfully"))

    
    // TODO: add a comment to a video
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { text } = req.body;
    const updatedComment=await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
               content:text
            }
        },
        {
             new:true
        }

        ).select("-owner -video")

        return res.status(200).
        json( new ApiResponse(200,updatedComment,"Comment updated successfully"))



    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const existingComment = await Comment.findById(commentId);
    if(!existingComment){
        throw new ApiError(400,"Please enter a valid commentId as comment not found")
    }
    await existingComment.remove();
    
    return res.status(200).
        json( new ApiResponse(200,existingComment,"Comment deleted successfully"))



    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }