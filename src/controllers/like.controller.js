import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid Id or Video not found");
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId,
    });

    if (existingLike) {
        await Like.findOneAndDelete({ video: videoId, likedBy: userId });
        return res.status(200).json(new ApiResponse(200, {}, "Video Unliked"));
    }

    const liked = await Like.create({
        video: videoId,
        likedBy: userId,
    });

    return res.status(200).json(new ApiResponse(200, liked, "Video Liked"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user?._id;
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(404, "Invalid Id or Comment not found");
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: userId,
    });

    if (existingLike) {
        await Like.findByIdAndDelete({ comment: commentId, likedBy: userId });
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Comment Unliked"));
    }

    const liked = await Like.create({
        comment: commentId,
        likedBy: userId,
    });

    return res.status(200).json(new ApiResponse(200, liked, "Comment Liked"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user?._id;
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "Invalid Id or tweet not found");
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId,
    });

    if (existingLike) {
        await Like.findByIdAndDelete({ tweet: tweetId, likedBy: userId });
        return res.status(200).json(new ApiResponse(200, {}, "tweet Unliked"));
    }

    const liked = await Like.create({
        tweet: tweetId,
        likedBy: userId,
    });

    return res.status(200).json(new ApiResponse(200, liked, "tweet Liked"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user?._id;
    const likedVideo = await Like.aggregate([
        {
            $match: {
                video: {
                    $exists: true,
                },
                likedBy: userId,
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            views: 1,
                            duration: 1,
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "likedBy",
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
                videoDetails: {
                    $first: "$videoDetails",
                },
                userDetails: {
                    $first: "$userDetails",
                },
            },
        },
    ]);

    if (!likedVideo) {
        throw new ApiError(401, "User has not liked any video");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideo,
                "All liked video fetched successfully"
            )
        );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
