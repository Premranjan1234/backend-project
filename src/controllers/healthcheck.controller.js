import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    try {
        // Respond with a simple JSON indicating the service is healthy
        return res.status(200).json(new ApiResponse(200, { message: "OK" }, "Service is healthy"));
    } catch (error) {
        // If there's an error, return an error response
        console.error(error);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
})

export {
    healthcheck
    }