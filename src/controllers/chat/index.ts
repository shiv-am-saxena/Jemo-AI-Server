import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import ChatModel from '../../models/chat.model';
import IUser from '../../types/user';
import { ApiError } from '../../utils/ApiError';
import { apiResponse } from '../../utils/apiResponse';
import MessageModel from '../../models/message.model';
import MediaRecord from '../../models/mediaRecord.model';
import client from '../../services/imagekit';
import { toFile } from '@imagekit/nodejs';
import { generateChatTitle } from '../../services/ai';



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
	const messages = (await MessageModel.find({ chatId }));

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

export const deleteChat = asyncHandler(async (req: Request, res: Response) => {
	const user = req.user as IUser;
	const { chatId } = req.params;
	if (!chatId) {
		throw new ApiError(400, 'Chat ID is required');
	}

	const chat = await ChatModel.findOne({ _id: chatId });
	if (!chat) {
		throw new ApiError(404, 'Chat not found');
	}
	if (chat.userId.toString() !== user._id.toString()) {
		throw new ApiError(403, 'You do not have permission to delete this chat');
	}

	const messages = await MessageModel.deleteMany({ chatId });
	if (messages.deletedCount === 0) {
		throw new ApiError(404, 'No messages found for the chat');
	}

	const ack = await ChatModel.deleteOne({ _id: chatId });
	if (ack.deletedCount === 0) {
		throw new ApiError(404, 'Failed to delete chat');
	}

	res
		.status(200)
		.json(
			new apiResponse(200, null, 'Chat and its messages deleted successfully')
		);
});

export const fileUpload = asyncHandler(async (req: Request, res: Response) => {
	if (!req.files) {
		throw new ApiError(400, 'No file uploaded');
	}

	// 1. Pehle strictly check kar lo ki file aur buffer dono exist karte hain
	if (
		!req.files ||
		!(req.files as Express.Multer.File[])[0] ||
		!(req.files as Express.Multer.File[])[0].buffer
	) {
		throw new ApiError(400, 'Invalid file upload. Buffer is missing.');
	}

	const file = (req.files as Express.Multer.File[])[0];

	// 2. Sirf 'file' aur 'fileName' bhejo. Koi signature/publicKey nahi!
	const uploadOptions = {
		file: await toFile(Buffer.from(file.buffer), 'file'), // Directly pass the buffer
		fileName: file.originalname || 'uploaded-file', // Fallback name agar originalName na ho
		folder: '/chat_app_uploads' // (Optional)
	};

	// 3. ImageKit global instance use karo (jo privateKey ke sath banaya tha)
	const imageKitResponse = await client.files.upload(uploadOptions);

	const mediaRecord = await MediaRecord.create({
		fileId: imageKitResponse.fileId
	});

	if (!mediaRecord) {
		throw new ApiError(500, 'Failed to save media record');
	}
	const responseData = {
		url: imageKitResponse.url,
		imagekitId: imageKitResponse.fileId
	};

	res
		.status(200)
		.json(new apiResponse(200, responseData, 'File uploaded successfully'));
});

export const newChat = asyncHandler(async (req: Request, res: Response) => {
	const user = req.user as IUser;
	const { message } = req.body;

	const title = await generateChatTitle(message);
	if (!title) {
		throw new ApiError(500, 'Failed to generate chat title');
	}
	const newChat = await ChatModel.create({
		userId: user._id,
		title: title,
		visibility: 'private'
	});

	if (!newChat) {
		throw new ApiError(500, 'Failed to create new chat');
	}

	res
		.status(201)
		.json(new apiResponse(201, { chatId: newChat._id , title: newChat.title, message: message }, 'New chat created successfully'));
});