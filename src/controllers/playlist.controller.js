import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.modal.js"
import {Video} from "../models/video.modal.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    const userId = req.user._id;
    const playlist=await Playlist.create({
        name,
        description,
        user:userId

    })
    const createdPlaylist=await Playlist.findById(playlist._id).select(
        "-videos "
    )
    if(!createdPlaylist){
        throw new ApiError(500,"Something went wrong while creating playlist")
    }
    return res.status(201).json(
        new ApiResponse(200,createdPlaylist,"playlist created successfully")
    )



     
    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    const playlist=await User.findById(userId).select()
    if(!playlist)
    {
        throw new ApiError(400,"Playlist doesn't exist")
    }
    return res.status(201).json(
        new ApiResponse(200,playlist,"playlist fetched successfully")
    )

    
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const playlist=await User.findById(playlistId).select()
    if(!playlist)
    {
        throw new ApiError(400,"Playlist doesn't exist")
    }
    return res.status(201).json(
        new ApiResponse(201,playlist,"playlist fetched successfully")
    )
    
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    const playlist = await Playlist.findById(playlistId);
    if(!playlist)
    {
        throw new ApiError(400,"Playlist doesn't exist")
    }
    const video = await Video.findById(videoId);
    if(!video)
    {
        throw new ApiError(400,"Video doesn't exist")
    }
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(200,"Video already exist in the playlist")
    }
    playlist.videos.push(videoId);

    await playlist.save();
    
    return res.status(200).json(200,playlist,"The video added successfully to the playlist")

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    const playlist = await Playlist.findById(playlistId);
    if(!playlist)
    {
        throw new ApiError(400,"Playlist doesn't exist")
    }
    const video = await Video.findById(videoId);
    if(!video)
    {
        throw new ApiError(500,"video doesn't exist")
    }
    playlist.videos = playlist.videos.filter((id) => id.toString() !== videoId);
      await playlist.save();
    
    return res.status(200).json(200,playlist.videos,"The video removed successfully from the playlist")


    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(400,"Playlist doesn't exist")
    }
    await Playlist.findByIdAndRemove(playlistId)

    return res.status(200).json(
        200,{},"Playlist is deleted successfully"
    )

    
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    const playlist = await Playlist.findById(playlistId);
      if (!playlist) {
         throw new ApiError(400,"playlist not found")
      }

      // Update the playlist
      playlist.name = name || playlist.name; // Update name if provided, otherwise keep the current value
      playlist.description = description || playlist.description; // Update description if provided, otherwise keep the current value
      await playlist.save();
      return res.status(200).json(
        200,playlist,"Playlist is updated successfully"
    )





    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}