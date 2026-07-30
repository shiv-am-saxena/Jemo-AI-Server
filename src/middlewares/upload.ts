import multer, { FileFilterCallback } from 'multer';
import { ApiError } from '../utils/ApiError.js';
import { Request } from 'express';

const storage = multer.memoryStorage();

const flexibleFileFilter = (
	req: Request,
	file: Express.Multer.File,
	cb: FileFilterCallback
) => {
	const mimeType = file.mimetype;

	const isImage = mimeType.startsWith('image/');
	const isText = mimeType.startsWith('text/');

	// 2. Safelist standard Document and Data MIME types
	const allowedAppMimes = [
		'application/pdf',
		'application/msword', // .doc
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
		'application/vnd.ms-excel', // .xls
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
		'application/rtf',
		'application/json',
		'application/xml',
		'application/javascript',
		'application/typescript'
	];
	const isAllowedDoc = allowedAppMimes.includes(mimeType);

	// 3. Extension fallback for code/text files
	// (Often sent as 'application/octet-stream' depending on the OS/Browser)
	const codeAndTextExtensions = [
		'.ts',
		'.tsx',
		'.js',
		'.jsx',
		'.py',
		'.rb',
		'.go',
		'.java',
		'.c',
		'.cpp',
		'.cs',
		'.php',
		'.md',
		'.json',
		'.yml',
		'.yaml',
		'.html',
		'.css',
		'.scss',
		'.sh',
		'.env',
		'.txt'
	];

	// Extract the extension safely
	const fileExtension =
		file.originalname.toLowerCase().match(/\.[^/.]+$/)?.[0] || '';
	const isCodeExtension = codeAndTextExtensions.includes(fileExtension);

	// 4. Final Validation
	if (isImage || isText || isAllowedDoc || isCodeExtension) {
		if (
			fileExtension === '.exe' ||
			fileExtension === '.bat' ||
			fileExtension === '.cmd'
		) {
			return cb(new ApiError(400, 'Executable files are strictly prohibited'));
		}
		return cb(null, true);
	}

	// If it falls through all checks, reject it
	return cb(
		new ApiError(
			400,
			`Unsupported file type: ${file.originalname}. Only images, documents, and text/code files are permitted.`
		)
	);
};

// Export the new multi-file uploader
export const uploadFiles = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024,
        files: 10
    },
    fileFilter: flexibleFileFilter
}).array('documents', 10);