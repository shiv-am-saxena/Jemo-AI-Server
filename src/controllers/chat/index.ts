import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import ChatModel from '../../models/chat.model';
import IUser from '../../types/user';
import { ApiError } from '../../utils/ApiError';
import { apiResponse } from '../../utils/apiResponse';
import MessageModel from '../../models/message.model';
import { Types } from 'mongoose';

export const getChatList = asyncHandler(async (req: Request, res: Response) => {
	const user = req.user as IUser;

	const chatList = await ChatModel.find({ userId: user._id });

	if (!chatList) {
		throw new ApiError(404, 'No chats found for the user');
	}
	res
		.status(200)
		.json(new apiResponse(200, chatList, 'Chat list retrieved successfully'));
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
	const user = req.user as IUser;
	const { chatId } = req.params;
	if (!chatId) {
		throw new ApiError(400, 'Chat ID is required');
	}

	const chat = await ChatModel.findOne({ _id: chatId });
	if (!chat) {
		throw new ApiError(404, 'Chat not found');
	}
	if (
		chat.visibility === 'private' &&
		chat.userId.toString() !== user._id.toString()
	) {
		throw new ApiError(403, 'You do not have permission to access this chat');
	}
	const messages = await MessageModel.find({ chatId });

	if (messages.length === 0) {
		throw new ApiError(404, 'No messages found for the chat');
	}

	res
		.status(200)
		.json(new apiResponse(200, messages, 'Messages retrieved successfully'));
});

export const chatSharing = asyncHandler(async (req: Request, res: Response) => {
	const user = req.user as IUser;
	const { chatId } = req.params;
	if (!chatId) {
		throw new ApiError(400, 'Chat ID is required');
	}

	const chat = await ChatModel.findOne({ _id: chatId });
	if (chat && chat.userId.toString() !== user._id.toString()) {
		throw new ApiError(403, 'You do not have permission to access this chat');
	}

	const updatedChat = await ChatModel.findOneAndUpdate(
		{ _id: chatId },
		{ visibility: 'public' },
		{ returnDocument: 'after' }
	);

	if (!updatedChat) {
		throw new ApiError(404, 'Chat not found');
	}

	const chatLink = `${process.env.CLIENT_URL}/chat/${updatedChat._id}`;

	res
		.status(200)
		.json(
			new apiResponse(200, { chatLink }, 'Chat sharing updated successfully')
		);
});

