import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { jwtPayload } from "../types/jwtPayload";
import jwt from "jsonwebtoken";
import User from "../models/user.model";

export const isLoggedIn = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;
    if (!token) {
        throw new ApiError(401, "Unauthorized");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET as string) as jwtPayload;
    if (!decodedToken) {
        throw new ApiError(401, "Unauthorized");
    }
    const user = await User.findById(decodedToken.id);
    if (!user) {
        throw new ApiError(401, "Unauthorized");
    }
    req.user = user;
    next();
})