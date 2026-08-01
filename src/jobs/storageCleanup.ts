import client from '../services/imagekit';
import MediaRecord from '../models/mediaRecord.model';
import { Request, Response, Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';

const cronRouter = Router();

cronRouter.post(
	'/cleanup',
	asyncHandler(async (req: Request, res: Response) => {
		const date = new Date();
		date.setDate(date.getDate() - 7); // 7 days ago

		// 1. Fetch all media records from the database
		const mediaRecords = await MediaRecord.find({
			uploadedAt: { $lt: date } // older than 7 days
		});

		const results = { successful: 0, failed: 0 };

		// 2. Delete each media from ImageKit and then remove the record from the database
		for (const record of mediaRecords) {
			try {

				await client.delete(record.fileId);

				// 3. Delete the record from your database after ImageKit confirms deletion
				await MediaRecord.findByIdAndDelete(record._id);

				results.successful++;
			} catch (error) {
				console.error(`Failed to delete fileId ${record.fileId}:`, error);
				results.failed++;
				// The catch block ensures that if one file fails, the loop still continues for the rest!
			}
		}

		// 4. Send a success response back to whatever service hit this endpoint
		res.status(200).json(new apiResponse(200, {results, totalProcessed: mediaRecords.length}, 'Cleanup process finished'));
	})
);

export default cronRouter;