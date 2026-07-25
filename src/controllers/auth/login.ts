import { asyncHandler } from "../../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { ApiError } from "../../utils/ApiError";
import passport from "../../services/passport";
import { NextFunction, Request, Response } from "express";
import User from "../../models/user.model";
import { apiResponse } from "../../utils/apiResponse";

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Check if the password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Generate JWT token
    const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET!,
        {
            expiresIn: '24h'
        }
    );

    res.status(200).json(new apiResponse(200, { token, user }, "Login successful"));
});

export const handleGithubAuthCallback = asyncHandler(async (req:Request, res:Response, next:NextFunction) => {
    passport.authenticate(
        'github',
        { session: false },
        (err: any, user: any, info: any) => {
            if (err) {
                return next(new ApiError(500, 'GitHub authentication failed', err));
            }
            if (!user) {
                const errorMessage = encodeURIComponent(
                    info?.message || 'GitHub authentication failed'
                );
                return res.redirect(
                    `${process.env.CLIENT_URL}/auth/register?error=${errorMessage}`
                );
            }

            const token = jwt.sign(
                { id: user._id, email: user.email },
                process.env.JWT_SECRET!,
                {
                    expiresIn: '24h'
                }
            );

            // Redirect back to frontend with the token
            res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
        }
    )(req, res, next);
});
export const handleGoogleAuthCallback = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	passport.authenticate(
		'google-signin',
		{ session: false },
		(err: any, user: any, info: any) => {
			if (err) {
				return next(new ApiError(500, 'Google authentication failed', err));
			}

			// If user doesn't exist, redirect to register with the error message
			if (!user) {
				const errorMessage = encodeURIComponent(
					info?.message || 'Google authentication failed'
				);
				return res.redirect(
					`${process.env.CLIENT_URL}/auth/register?error=${errorMessage}`
				);
			}

			// Generate JWT for the authenticated user
			const token = jwt.sign(
				{ id: user._id, email: user.email },
				process.env.JWT_SECRET!,
				{
					expiresIn: '24h'
				}
			);

			// Redirect back to frontend with the token
			res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
		}
	)(req, res, next);
};