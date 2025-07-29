import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheckController = asyncHandler(async (req, res) => {
    return res
        .status(201)
        .json(new ApiResponse(200, "Pass", "Healthcheck done!!!"));
});

export { healthcheckController };
