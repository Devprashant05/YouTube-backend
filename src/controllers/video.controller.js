import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Get all videos

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    return res.status(200).json(200, {}, "video route working");
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
// update video
// delete video
// toggle status

export { getAllVideos, publishAVideo };
