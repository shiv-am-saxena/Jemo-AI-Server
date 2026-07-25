import User from '../../models/user.model';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import passport from '../../services/passport';
import { sendVerificationEmail } from '../../services/nodemailer';
import { apiResponse } from '../../utils/apiResponse';
import { jwtPayload } from '../../types/jwtPayload';
import { Request, Response, NextFunction } from 'express'; // Added NextFunction

const register = asyncHandler(async (req: Request, res: Response) => {
	const { name, email, password } = req.body;

	const existingUser = await User.findOne({ email });
	if (existingUser) {
		throw new ApiError(400, 'User already exists');
	}

	const user = await User.create({ name, email, password });

	const token = jwt.sign(
		{ id: user._id, email: user.email },
		process.env.JWT_SECRET!,
		{
			expiresIn: '1h'
		}
	);

	const isEmailSent = await sendVerificationEmail(user.email, token);
	if (!isEmailSent) {
		throw new ApiError(500, 'Failed to send verification email');
	}

	res
		.status(201)
		.json(
			new apiResponse(
				201,
				{ user: user._id },
				'User registered successfully. Please check your email to verify your account.'
			)
		);
});

const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
	const { token } = req.query;

	if (!token || typeof token !== 'string') {
		throw new ApiError(400, 'Verification token is required');
	}

	const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwtPayload;
	if (!decoded) {
		throw new ApiError(400, 'Invalid verification token');
	}

	// FIX 1: Access 'id', not '_id', based on how it was signed
	const userId = decoded.id;
	const user = await User.findById(userId);

	if (!user) {
		throw new ApiError(404, 'User not found');
	}

	const updatedUser = await User.findByIdAndUpdate(
		userId,
		{ isVerified: true },
		{ returnDocument: 'after' }
	);
	if (!updatedUser) {
		throw new ApiError(500, 'Failed to verify user');
	}

	res
		.status(200)
		.json(
			new apiResponse(
				200,
				{ user: updatedUser._id },
				'Email verified successfully'
			)
		);
});

// FIX 2 & 3: Remove asyncHandler, add next(), use next(err) and res.redirect()
const registerWithGoogle = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	passport.authenticate(
		'google-signup',
		{ session: false },
		(err: any, user: any, info: any) => {
			if (err) {
				return next(new ApiError(500, 'Google authentication failed', err));
			}
			if (!user) {
				const errorMessage = encodeURIComponent(
					info?.message || 'Google authentication failed'
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
	)(req, res, next); // Pass next here!
};


export { register, verifyEmail, registerWithGoogle };
