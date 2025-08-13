import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    //TODO: create playlist
    if (!name || !description) {
        throw new ApiError(401, "All fields are required");
    }

    const newPlaylist = await Playlist.create({
        name,
        description,
        owner: req.user?._id,
    });

    if (!newPlaylist) {
        throw new ApiError(401, "Something went wrong while creating playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(201, newPlaylist, "Successfully created Playlist")
        );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    //TODO: get user playlists
    if (!isValidObjectId(userId)) {
        throw new ApiError(404, "Invalid user id or user id not found");
    }

    const playlistDetails = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "userDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                userDetails: {
                    $first: "$userDetails",
                },
            },
        },
    ]);

    if (!playlistDetails) {
        throw new ApiError(404, "Playlist is empty or playlist not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlistDetails,
                "User playlists fetched successfully"
            )
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404, "Invalid playlist id or playlist not found");
    }

    const playlistDetails = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "userDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                userDetails: {
                    $first: "$userDetails",
                },
            },
        },
    ]);

    if (!playlistDetails) {
        throw new ApiError(404, "Playlist is empty or playlist not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlistDetails[0],
                "Playlists fetched successfully"
            )
        );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid playlist or video id");
    }

    const playlist = await Playlist.findById(playlistId);
    const userId = req.user?._id;

    if (!(playlist.owner.toString() === userId.toString())) {
        throw new ApiError(403, "You can only add videos to your own playlist");
    }

    if (playlist.video.includes(videoId)) {
        throw new ApiError(401, "Video already added in playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {
                video: videoId,
            },
        },
        {
            $new: true,
        }
    );

    if (!updatedPlaylist) {
        throw new ApiError(
            401,
            "Something went wrong while adding video to playlist"
        );
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Video added to playlist successfully"
            )
        );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid playlist or video id");
    }

    const playlist = await Playlist.findById(playlistId);
    const userId = req.user?._id;

    if (!(playlist.owner.toString() === userId.toString())) {
        throw new ApiError(
            403,
            "You can only remove videos to your own playlist"
        );
    }

    if (!playlist.video.includes(videoId)) {
        throw new ApiError(401, "Video already removed from playlist");
    }

    playlist.video = playlist.video.filter(
        (vidId) => vidId.toString() !== videoId
    );

    await playlist.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Video removed from playlist successfully"
            )
        );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404, "Invalid playlist id or playlist not found");
    }

    const playlist = await Playlist.findById(playlistId);
    const userId = req.user?._id;

    if (!(playlist.owner.toString() === userId.toString())) {
        throw new ApiError(403, "You can only delete your own playlist");
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    if (!deletedPlaylist) {
        throw new ApiError(401, "something went wrong while deleting playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                deletedPlaylist,
                "Playlist deleted successfully"
            )
        );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    //TODO: update playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404, "Invalid playlist id or playlist not found");
    }

    const playlist = await Playlist.findById(playlistId);
    const userId = req.user?._id;

    if (!(playlist.owner.toString() === userId.toString())) {
        throw new ApiError(403, "You can only update your own playlist");
    }

    if (!name || !description) {
        throw new ApiError(
            401,
            "All fields are required to update the playlist"
        );
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description,
            },
        },
        {
            $new: true,
        }
    );

    if (!updatedPlaylist) {
        throw new ApiError(500, "Something went worng while updating playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                updatedPlaylist,
                "Playlist updated successfully"
            )
        );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
