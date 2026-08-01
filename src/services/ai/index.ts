import { ApiError } from '../../utils/ApiError';
import { MistralAI } from './ai';
import { AIMessage, HumanMessage, SystemMessage } from 'langchain';
import { getAgent } from './tools';
export async function generateChatTitle(message: string): Promise<string> {
	const prompt = `Generate a concise and descriptive title of the ${message}. The title should be in title case and no longer than 3-5 words maximum.`;
	const response = await MistralAI.invoke([
		new SystemMessage(prompt),
	]);

	return response.content as string;
}


export async function generateChatStream(prompt: string, modelId: string, webSearch: boolean, chatId: string, history: any[]) {
    const agent = getAgent(modelId, webSearch, chatId);

    // Naya user message history me add karein
    const finalMessages = [...history, new HumanMessage(prompt)];

    // .stream() ki jagah .streamEvents() use karein
    const stream = await agent.streamEvents(
        { messages: finalMessages },
        { version: "v2" }
    );

    return stream;
}