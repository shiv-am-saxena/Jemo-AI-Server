import dotenv from 'dotenv';
dotenv.config();
import connectDb from './db/mongooseConnection';
import { app } from './app';
import errorHandler from './middlewares/errorHandler';

const port = process.env.PORT || 8080;

connectDb()
	.then(() => {
		app.listen(port, () => {
			console.log(`Server is running at port ${port}`);
		});
	})
	.catch((err) => {
		console.log(`Connection to the database failed due to ${err}`);
	});

app.use(errorHandler);