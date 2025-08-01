import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";

//TODO: create tweet
/**
 * get the data
 * validate the data
 * check for current valid user
 * save the tweet
 * return res
 */
const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content) {
        throw new ApiError(401, "Content is required");
    }

    const loggedInUser = await User.findById(req.user?._id);

    if (!loggedInUser) {
        throw new ApiError(404, "Please logged in to create tweet");
    }

    const tweet = await Tweet.create({
        content,
        owner: loggedInUser._id,
    });

    if (!tweet) {
        throw new ApiError(401, "Error while creating tweet");
    }

    return res
        .status(200)
        .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

// TODO: get user tweets
const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(401, "Invalid User Id");
    }

    // const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });
    const tweets = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "tweets",
                localField: "_id",
                foreignField: "owner",
                as: "userTweet",
            },
        },
        {
            $addFields: {
                tweet: {
                    $first: "$userTweet",
                },
            },
        },
        {
            $project: {
                username: 1,
                fullname: 1,
                avatar: 1,
                tweet: 1,
            },
        },
    ]);

    if (!tweets) {
        throw new ApiError(404, "Tweets not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(201, tweets, "All Tweets fetched successfully"));
});

//TODO: update tweet
const updateTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { tweetId } = req.params;
    const userID = req.user?._id;

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Invalid Tweet Id or Tweet Not Found");
    }

    if (!(tweet.owner.toString() === userID.toString())) {
        throw new ApiError(401, "You can only update your own tweet");
    }

    if (!content) {
        throw new ApiError(401, "Tweet Content is required to update");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content,
            },
        },
        {
            $new: true,
        }
    );

    if (!updatedTweet) {
        throw new ApiError(401, "Something went wrong while updating tweet");
    }

    return res
        .status(200)
        .json(new ApiResponse(201, updatedTweet, "Tweet Updated Successfully"));
});

//TODO: delete tweet

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user?.id;

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Invalid Tweet Id or Tweet Not Found");
    }

    if (!(tweet.owner.toString() === userId.toString())) {
        throw new ApiError(401, "You can only delete your own tweet");
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    if (!deletedTweet) {
        throw new ApiError(
            400,
            "Something went wrong while deleting the tweet"
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(201, deletedTweet, "Tweet delete successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
