import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user?._id;
    // TODO: toggle subscription

    if (!isValidObjectId(channelId)) {
        throw new ApiError(404, "Invalid Channel Id or Channel not found");
    }

    if (channelId.toString() === subscriberId.toString()) {
        throw new ApiError(401, "You cannot Subscribed to your own channel");
    }

    const existingSub = await Subscription.findOne({
        channel: channelId,
        subscriber: Subscription,
    });

    if (existingSub) {
        await existingSub.deleteOne();
        return res
            .status(200)
            .json(
                new ApiResponse(201, {}, "Channel Unsubscribed Successfully")
            );
    }

    const newSubscription = await Subscription.create({
        channel: channelId,
        subscriber: subscriberId,
    });

    if (!newSubscription) {
        throw new ApiError(401, "Something went wrong while subscribing");
    }

    return res
        .status(200)
        .json(201, newSubscription, "Channel Subscribed Successfully");
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // if (!isValidObjectId(channelId)) {
    //     throw new ApiError(404, "Invalid Channel Id or Channel not found");
    // }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            fullname: 1,
                            username: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                subscribers: {
                    $first: "$subscribers",
                },
            },
        },
    ]);

    if (!subscribers) {
        throw new ApiError(
            401,
            "Subscribers not found or You don't have any subscriber"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                subscribers,
                "Subscribers fetched successfully"
            )
        );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(
            404,
            "Invalid Subscriber Id or Subscriber not found"
        );
    }

    const subscribedTo = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedTo",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            fullname: 1,
                            username: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                subscribedTo: {
                    $first: "$subscribedTo",
                },
            },
        },
    ]);

    if (!subscribedTo) {
        throw new ApiError(401, "You don't have subscribed to any channels");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                subscribedTo,
                "Channel List fetched successfully"
            )
        );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
