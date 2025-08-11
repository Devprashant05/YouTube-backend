import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import {
    deleteFromCloudinary,
    uploadOnCloudinary,
} from "../utils/cloudinary.js";
import mongoose from "mongoose";

// Get all videos

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query = "",
        sortBy = "createdAt",
        sortType = "desc",
        userId,
    } = req.query;

    const videos = await Video.aggregate([
        // match Stage for filtering
        {
            $match: {
                $or: [
                    { title: { $regex: query || "", $options: "i" } },
                    { description: { $regex: query || "", $options: "i" } },
                ],
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "videoCreatedBy",
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
                videoCreatedBy: {
                    $first: "$videoCreatedBy",
                },
            },
        },
        {
            $project: {
                thumbnail: 1,
                videoFile: 1,
                title: 1,
                description: 1,
                videoCreatedBy: 1,
            },
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1,
            },
        },
        {
            $skip: (page - 1) * limit,
        },
        {
            $limit: parseInt(limit),
        },
    ]);

    if (!videos?.length) {
        return new ApiError(404, "No Videos Found");
    }

    return res
        .status(200)
        .json(new ApiResponse(201, videos, "Videos Fetched Successfully"));
});

// publish video
const publishAVideo = asyncHandler(async (req, res) => {
    // get user id for saving the author.
    // get all the details
    // normal validations
    // get video path
    // validate and upload on cloudinary
    // create a video

    const { title, description } = req.body;

    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(401, "All fields are required");
    }

    const localVideoFilePath = req.files?.videoFile[0]?.path;
    const thumbnailFilePath = req.files?.thumbnail[0]?.path;

    if (!localVideoFilePath && !thumbnail) {
        throw new ApiError(401, "Video File and Thumbnail is required");
    }

    const videoFile = await uploadOnCloudinary(localVideoFilePath);
    const thumbnailFile = await uploadOnCloudinary(thumbnailFilePath);

    if (!videoFile && !thumbnailFile) {
        throw new ApiError(
            401,
            "Error while uploading video and thumbnail to cloudinary"
        );
    }

    const videoFileRes = await Video.create({
        videoFile: videoFile.url,
        videoFileId: videoFile.public_id,
        thumbnail: thumbnailFile.url,
        thumbnailId: thumbnailFile.public_id,
        duration: videoFile.duration,
        title,
        description,
        owner: req.user._id,
    });

    if (!videoFileRes) {
        throw new ApiError(404, "Error while uploading video on DB");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(200, videoFileRes, "Video uploaded successfully")
        );
});

// get video by Id
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(404, "Video Id is missing");
    }

    const videoDetails = await Video.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(videoId) },
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

    if (!videoDetails) {
        throw new ApiError();
    }

    return res
        .status(200)
        .json(
            new ApiResponse(201, videoDetails[0], "Video Fetched successfully")
        );
});

// update video
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const thumbnailFile = req.file?.path;
    const userId = req.user?.id;

    const videoDetails = await Video.findById(videoId);

    if (!videoDetails) {
        throw new ApiError(404, "Invalid Id or Video Not found");
    }

    if (!(videoDetails.owner.toString() === userId.toString())) {
        throw new ApiError(401, "You can only update your own Video");
    }

    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(401, "All fields are required");
    }

    if (!thumbnailFile) {
        throw new ApiError(401, "Thumbnail file is required");
    }

    await deleteFromCloudinary(videoDetails.thumbnailId, "image");

    const result = await uploadOnCloudinary(thumbnailFile);

    if (!result) {
        throw new ApiError(
            401,
            "Error while uploading thumbnail on cloudinary"
        );
    }

    const updatedDetails = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: result.url,
                thumbnailId: result.public_id,
            },
        },
        {
            $new: true,
        }
    );

    if (!updatedDetails) {
        throw new ApiError(401, "Error while updating details");
    }

    return res
        .status(200)
        .json(new ApiResponse(201, updatedDetails, "Video details updated"));
});

// delete video
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Invalid video Id or video Not Found");
    }

    if (!(video.owner.toString() === userId.toString())) {
        throw new ApiError(401, "You can only delete your own video");
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if (!deletedVideo) {
        throw new ApiError(
            400,
            "Something went wrong while deleting the video"
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(201, deletedVideo, "video delete successfully"));
});

// toggle status
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Invalid Video Id or video is missing");
    }

    if (!(video.owner.toString() === userId.toString())) {
        throw new ApiError(
            401,
            "You can only toggle your own video publish status"
        );
    }

    const currentToggleStatus = video.isPublished;

    const updatedToggleStatus = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !currentToggleStatus,
            },
        },
        { $new: true }
    );

    if (!updatedToggleStatus) {
        throw new ApiError(
            401,
            "Something went wrong while updating toggle status"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                updatedToggleStatus,
                "Toggle Status updated Successfully"
            )
        );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    deleteVideo,
    updateVideo,
    togglePublishStatus,
};
