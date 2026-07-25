import mongoose from 'mongoose';

const connectDb = async () => {
	try {
		const connectionInstance = await mongoose.connect(
			process.env.MONGODB_URI as string
		); // connectionInstance provides the
		console.log(`MongoDB connected successfully`);
	} catch (err) {
		console.log(`MongoDB connection error: ${err}`);
		process.exit(1);
	}
};
export default connectDb;
