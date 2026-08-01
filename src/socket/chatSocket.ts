import { Server, Socket } from 'socket.io';
import logger from '../services/logger';
import MessageModel from '../models/message.model';
import { generateChatStream } from '../services/ai';
import { ApiError } from '../utils/ApiError';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { processFileToText } from '../services/ai/rag/fileProcessor';
import { ingestDocument } from '../services/ai/rag';

const extractStreamText = (chunk: unknown): string => {
	if (typeof chunk === 'string') {
		return chunk;
	}

	if (Array.isArray(chunk)) {
		return chunk.map(extractStreamText).join('');
	}

	if (!chunk || typeof chunk !== 'object') {
		return '';
	}

	const typedChunk = chunk as {
		content?: unknown;
		text?: unknown;
		response_metadata?: { output_version?: string };
	};

	if (typeof typedChunk.text === 'string') {
		return typedChunk.text;
	}

	if (Array.isArray(typedChunk.content)) {
		return typedChunk.content
			.map((part) => {
				if (typeof part === 'string') {
					return part;
				}

				if (part && typeof part === 'object') {
					const textPart = part as { type?: string; text?: unknown; content?: unknown };

					if (typeof textPart.text === 'string') {
						return textPart.text;
					}

					return extractStreamText(textPart.content);
				}

				return '';
			})
			.join('');
	}

	if (typeof typedChunk.content === 'string') {
		return typedChunk.content;
	}

	return '';
};

export const registerChatHandlers = (io: Server, socket: Socket) => {
	socket.on('join_chat', (chatId: string) => {
		socket.join(chatId);
		logger.info(`Socket ${socket.id} joined room: ${chatId}`);
	});

	socket.on('generate_ai_response', async (payload) => {
		const { chatId, prompt, files, model, webSearchEnabled } = payload;

		try {
			// FIX 3: Naya message save karne se pehle purani history nikal lein
			// Taaki current prompt history me duplicate na ho
			const pastMessages = await MessageModel.find({ chatId: chatId })
				.sort({ createdAt: 1 })
				.limit(10);

			const messageHistory = pastMessages.map((msg) => {
				if (msg.direction === 'inbound') {
					return new HumanMessage(msg.content.text);
				} else {
					return new AIMessage(msg.content.text);
				}
			});

			// Ab naya user message DB me save karein
			const userMessage = await MessageModel.create({
				chatId: chatId,
				aiModel: model,
				direction: 'inbound',
				content: {
					// SAFEGUARD: Agar prompt empty hai (sirf file bheji h), toh fallback text use karein
					text: prompt || '[Attachment Only]',
					media: files || []
				}
			});

			if (!userMessage) {
				throw new ApiError(500, 'Failed to create user message');
			}

			// Frontend ko notify karein ki processing shuru ho gayi hai
			io.to(chatId).emit('generation_started', { messageId: userMessage._id });

			// FIX 1 & 2: Process files async and Ingest to Qdrant
			if (files && files.length > 0) {
				try {
					const extractedTexts = await Promise.all(
						files.map(async (fileData: any) => {
							// 1. ImageKit URL se file ko download/fetch karein
							const response = await fetch(fileData.url);
							const blob = await response.blob();

							// 2. Us blob ko 'File' object me convert karein (processFileToText ke liye)
							const fileObj = new File(
								[blob],
								fileData.imagekitId || 'downloaded_file',
								{
									type: blob.type
								}
							);

							return processFileToText(fileObj as any);
						})
					);

					for (let i = 0; i < extractedTexts.length; i++) {
						await ingestDocument(extractedTexts[i], {
							chatId: chatId,
							filename: files[i].url
						});
					}
				} catch (ragError) {
					logger.error('Error ingesting files to Qdrant:', ragError);
				}
			}

			// chatSocket.ts me generateChatStream call ke baad ka hissa:

			let fullAiResponse = '';
			const stream = await generateChatStream(
				prompt,
				model,
				webSearchEnabled,
				chatId,
				messageHistory
			);

			// Stream events par loop chalayein
			for await (const event of stream) {
				// Sirf 'on_chat_model_stream' event ko pakdein (Jab LLM type kar raha ho)
				if (event.event === 'on_chat_model_stream') {
					// Chunk event.data.chunk ke andar hota hai
					const textChunk = extractStreamText(event.data.chunk);

					if (textChunk) {
						fullAiResponse += textChunk;
						io.to(chatId).emit('stream_chunk', { chunk: textChunk });
					}
				}
			}

			// Final response save karein (Safeguard ke sath)
			if (!fullAiResponse || fullAiResponse.trim() === '') {
				fullAiResponse = "I couldn't generate a response. Please try again.";
				io.to(chatId).emit('stream_chunk', { chunk: fullAiResponse });
			}

			const aiMessage = await MessageModel.create({
				chatId: chatId,
				direction: 'outbound',
				content: { text: fullAiResponse },
				aiModel: model
			});
			
			io.to(chatId).emit('stream_complete', {
				status: 'success',
				messageId: aiMessage._id
			});
		} catch (error) {
			logger.error('Error in AI generation stream:', error);
			io.to(chatId).emit('stream_error', {
				error: 'Failed to generate response. Please try again.'
			});
		}
	});
};
