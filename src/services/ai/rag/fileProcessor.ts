import { PDFParse } from 'pdf-parse'; // Note: Default import use karein
import { ApiError } from '../../../utils/ApiError';

export async function processFileToText(file: {
	url: string;
	imagekitId: string;
	fileType: string;
}): Promise<string> {
	const { fileType, url } = file;

	try {
		// 1. ImageKit URL se file ko fetch karein
		const response = await fetch(url);

		if (!response.ok) {
			throw new ApiError(
				500,
				`Failed to fetch file from ImageKit. Status: ${response.status}`
			);
		}

		// 2. Fetched data ko Buffer me convert karein
		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// 3. Handle Plain Text / Markdown / CSV
		if (fileType.startsWith('text/') || fileType === 'text/csv') {
			return buffer.toString('utf-8');
		}

		// 4. Handle PDFs
		if (fileType === 'application/pdf') {
			try {
				// pdf-parse ko direct buffer pass kiya jata hai
				const pdfData = new PDFParse({data:buffer});
				return (await pdfData.getText()).text;
			} catch (error) {
				console.error('Failed to parse PDF:', error);
				throw new ApiError(501, 'Failed to extract text from PDF.');
			}
		}

		// 5. Fallback for unsupported types (Images, Word docs, etc.)
		throw new ApiError(415, `Unsupported file type: ${fileType}`);
	} catch (error: any) {
		console.error('File Processing Error:', error);
		// Agar error pehle se humara ApiError hai, toh wahi throw karein
		if (error instanceof ApiError) throw error;
		throw new ApiError(500, 'Error downloading or processing the file from URL.');
	}
}
