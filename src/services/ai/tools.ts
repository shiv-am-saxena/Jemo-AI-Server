import * as z from 'zod';
import { createAgent, tool } from 'langchain';
import { tavily as Tavily } from '@tavily/core';
import { Gemini, MistralAI, Nvidia } from './ai';
import { embeddings, ensureChatIdPayloadIndex, qdrantConfig } from './rag';
import { QdrantVectorStore } from '@langchain/qdrant';
const TAVILY_API_KEY = process.env.TAVILY_API_KEY as string;
const TavilyClient = Tavily({ apiKey: TAVILY_API_KEY });

// Create a factory function for the tool
export const getWebSearchTool = (isExtendedSearch: boolean) => {
	return tool(
		async ({ query }: { query: string }) => {
			const result = await TavilyClient.search(query, {
				searchDepth: isExtendedSearch ? 'advanced' : 'basic'
			});
			return JSON.stringify(result);
		},
		{
			name: 'web-search',
			description:
				'A tool for performing web searches to get up-to-date information. Input should be a search query string.',
			schema: z.object({
				query: z.string().describe('The search query string.')
			})
		}
	);
};

// Create a factory function for your agents
export const getAgent = (modelId: string, isExtendedSearch: boolean, chatId: string) => {
	const searchTool = getWebSearchTool(isExtendedSearch);
	const ragTool = getRagTool(chatId);
	let selectedModel;
	switch (modelId) {
		case 'mistral':
			selectedModel = MistralAI;
			break;
		case 'nvidia':
			selectedModel = Nvidia;
			break;
		case 'gemini':
			selectedModel = Gemini;
			break;
		default:
			selectedModel = MistralAI;
			break;
	}

	return createAgent({
		model: selectedModel,
		tools: [searchTool, ragTool],
	});
};

export const getRagTool = (chatId: string) =>
	tool(
		async ({ query }) => {
			console.log(`\n--- 🔍 Agent Invoked getRagTool ---`);
			console.log(`[RAG Tool] Search Query: "${query}"`);

			try {
				await ensureChatIdPayloadIndex();

				// Re-use / connect to existing Qdrant Collection
				const vectorStore = await QdrantVectorStore.fromExistingCollection(
					embeddings,
					qdrantConfig
				);

				// Set up retriever to fetch top 4 relevant chunks
				const retriever = vectorStore.asRetriever({
					k: 4,
					filter: {
						must: [
							{
								key: 'chatId',
								match: {
									value: chatId
								}
							}
						]
					}
				});

				console.log(`[RAG Tool] Fetching top matching chunks from Qdrant...`);
				const results = await retriever.invoke(query);

				console.log(
					`[RAG Tool] ✅ Successfully retrieved ${results.length} document chunk(s).`
				);

				if (results.length === 0) {
					return 'No relevant context found in the uploaded documents.';
				}

				// Combine document contents into a single readable string for the LLM
				const formattedContext = results
					.map(
						(doc, idx) =>
							`[Source Chunk ${idx + 1} - File: ${doc.metadata?.filename || 'Unknown'}]:\n${doc.pageContent}`
					)
					.join('\n\n---\n\n');

				return formattedContext;
			} catch (error) {
				console.error(`[RAG Tool] ❌ Error executing search:`, error);
				return 'An error occurred while retrieving information from the document store.';
			}
		},
		{
			name: 'get_rag_context',
			description:
				'Searches and retrieves relevant document excerpts and text context from Qdrant to help answer specific user questions.',
			schema: z.object({
				query: z
					.string()
					.describe(
						'The search query or keywords to look up in the vector database.'
					)
			})
		}
	);
