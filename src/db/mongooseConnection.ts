import mongoose from 'mongoose';
import logger from '../services/logger';

const connectDb = async () => {
	try {
		const connectionInstance = await mongoose.connect(
			process.env.MONGODB_URI as string
		); // connectionInstance provides the
		logger.info(`MongoDB connected successfully`);
	} catch (err) {
		logger.error(`MongoDB connection error: ${err}`);
		process.exit(1);
	}
};
export default connectDb;
