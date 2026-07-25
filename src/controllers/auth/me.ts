import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { apiResponse } from "../../utils/apiResponse";

export const fetchProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized");
    }

    res.status(200).json(new apiResponse(200, req.user, "User profile fetched successfully"));
});