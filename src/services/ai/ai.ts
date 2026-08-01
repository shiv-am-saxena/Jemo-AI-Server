import { ChatOpenAI } from '@langchain/openai';
import { ChatMistralAI } from '@langchain/mistralai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';


const NVIDIA_KEY = process.env.NVIDIA_API_KEY as string;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY as string;

const Nvidia = new ChatOpenAI({
	apiKey: NVIDIA_KEY,
	configuration: {
		baseURL: 'https://integrate.api.nvidia.com/v1'
	},
	model: 'deepseek-ai/deepseek-v4-pro',
	temperature: 1,
	topP: 0.95,
	maxTokens: 16384
});

const MistralAI = new ChatMistralAI({
    apiKey: MISTRAL_API_KEY,
    model: 'mistral-small-latest',
    temperature: 0.7,
    maxTokens: 4096
});

const Gemini = new ChatGoogleGenerativeAI({
	model: 'gemini-2.5-lite-preview',
	apiKey: GEMINI_API_KEY,
	temperature: 0.7,
});

export { Nvidia, MistralAI, Gemini };