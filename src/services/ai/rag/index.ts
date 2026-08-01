import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantVectorStore } from '@langchain/qdrant';
import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { ApiError } from '../../../utils/ApiError';

export const embeddings = new OpenAIEmbeddings({
	apiKey: process.env.NVIDIA_API_KEY,
	configuration: {
		baseURL: 'https://integrate.api.nvidia.com/v1'
	},
	modelName: 'nvidia/nv-embed-v1'
});

export const qdrantConfig = {
	url: process.env.QDRANT_CLUSTER_URL as string,
	apiKey: process.env.QDRANT_API_KEY as string,
	collectionName: 'chat_documents'
};

const qdrantClient = new QdrantClient({
	url: qdrantConfig.url,
	apiKey: qdrantConfig.apiKey
});

let chatIdIndexPromise: Promise<void> | null = null;

export async function ensureChatIdPayloadIndex() {
	if (!chatIdIndexPromise) {
		chatIdIndexPromise = qdrantClient
			.createPayloadIndex(qdrantConfig.collectionName, {
				field_name: 'chatId',
				field_schema: 'keyword',
				wait: true
			})
			.then(() => undefined)
			.catch((error) => {
				const errorText = [
					(error as any)?.data?.status?.error,
					(error as any)?.message,
					String(error)
				]
					.filter(Boolean)
					.join(' ');

				if (/already exists|already present/i.test(errorText)) {
					return;
				}

				chatIdIndexPromise = null;
				throw error;
			});
	}

	return chatIdIndexPromise;
}

export async function ingestDocument(text: string, metadata: any = {}) {
	console.log(`\n--- 🚀 Starting Document Ingestion ---`);
	console.log(
		`[1/4] Preparing to process file: ${metadata.filename || 'Unknown File'}`
	);
	console.log(`      Initial text length: ${text.length} characters.`);

	try {
		// 1. Configure the text splitter
		// FIX: chunkOverlap (200) must be smaller than chunkSize (1000)
		const splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 200
		});
		console.log(
			`[2/4] Initialized text splitter (Chunk Size: 1000, Overlap: 200).`
		);

		// 2. Split the text into document chunks
		console.log(`      Splitting text into chunks...`);
		const docs = await splitter.createDocuments([text], [metadata]);
		console.log(
			`[3/4] Successfully split text into ${docs.length} document chunks.`
		);

		// Optional: Log the first chunk to verify metadata and content
		if (docs.length > 0) {
			console.log(
				`      Sample chunk [1/${docs.length}] metadata:`,
				docs[0].metadata
			);
			console.log(
				`      Sample chunk [1/${docs.length}] content preview: "${docs[0].pageContent.substring(0, 50)}..."`
			);
		}

		// 3. Upsert to Qdrant
		console.log(`[4/4] Connecting to Qdrant at ${qdrantConfig.url}...`);
		console.log(
			`      Generating NVIDIA nv-embed-v1 embeddings and upserting into collection '${qdrantConfig.collectionName}'...`
		);

		await ensureChatIdPayloadIndex();
		await QdrantVectorStore.fromDocuments(docs, embeddings, qdrantConfig);

		console.log(
			`--- ✅ SUCCESS: Ingested ${docs.length} chunks from ${metadata.filename || 'the document'} into Qdrant. ---\n`
		);
	} catch (error) {
		console.error(`--- ❌ ERROR: Failed to ingest document ---`);
		console.error(error);
		throw new ApiError(500, 'Failed to ingest document into Qdrant.');
	}
}
