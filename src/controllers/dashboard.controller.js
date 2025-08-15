import mongoose, { isValidObjectId, Mongoose } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { userInfo } from "os";

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(404, "Invalid id or channel not found");
    }

    const totalSubscriber = await Subscription.countDocuments({ channelId });
    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId),
                isPublished: true,
            },
        },
    ]);
    const totalVideos = videos.length;
    const totalVideoViews = videos.reduce((acc, video) => acc + video.views, 0);
    const totalLikes = await Like.countDocuments({
        videoId: { $in: videos.map((video) => video._id) },
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalSubscriber,
                totalVideos,
                totalVideoViews,
                totalLikes,
            },
            "Channel stats fetched successfully"
        )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(404, "Invalid id or channel not found");
    }

    const allVideos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId),
                isPublished: true,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "userInfo",
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
                userInfo: {
                    $first: "$userInfo",
                },
            },
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                userInfo: 1,
            },
        },
    ]);

    if (allVideos.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "No video uploaded in channel"));
    } else {
        return res
            .status(200)
            .json(new ApiResponse(200, allVideos, "all videos fetched"));
    }
});

export { getChannelStats, getChannelVideos };
