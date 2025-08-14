import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid id or video not found");
    }

    const videoComments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
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
                            avatar: 1,
                            fullname: 1,
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes",
            },
        },
        {
            $addFields: {
                userInfo: {
                    $first: "$userInfo",
                },
                likes: {
                    $size: "$likes",
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user._id, "$likes.likedBy"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $skip: (page - 1) * limit,
        },
        {
            $limit: parseInt(limit),
        },
    ]);

    if (!videoComments.length) {
        throw new ApiError(401, "No Comments on video");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videoComments,
                "Video Comments fetched successfully"
            )
        );
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const userId = req.user?._id;
    const { content } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid Id or Video not found");
    }

    if (!content) {
        throw new ApiError(401, "Content cannot be empty");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId,
    });

    if (!comment) {
        throw new ApiError(500, "Something went wrong while creating comment");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(404, "Invalid id or Comment not found");
    }

    const comment = await Comment.findById(commentId);

    if (!(comment.owner.toString() === userId.toString())) {
        throw new ApiError(400, "You can only update your own comment");
    }

    if (!content) {
        throw new ApiError(401, "Content cannot be empty");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content,
            },
        },
        {
            $new: true,
        }
    );

    if (!updatedComment) {
        throw new ApiError(500, "Something went wrong while upadating comment");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Comment updated successfully")
        );
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    const userId = req.user?._id;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(404, "Invalid id or Comment not found");
    }

    const comment = await Comment.findById(commentId);

    if (!(comment.owner.toString() === userId.toString())) {
        throw new ApiError(400, "You can only delete your own comment");
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    return res
        .status(200)
        .json(
            new ApiResponse(200, deletedComment, "Comment deleted successfully")
        );
});

export { getVideoComments, addComment, updateComment, deleteComment };
