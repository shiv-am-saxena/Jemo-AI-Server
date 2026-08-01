import dotenv from 'dotenv';
dotenv.config();
import connectDb from './db/mongooseConnection';
import { app } from './app';
import errorHandler from './middlewares/errorHandler';
import http  from 'http';
import { initSocket } from './socket/socket';
import logger from './services/logger';

const port = process.env.PORT || 8080;
const httpServer = http.createServer(app);
httpServer.setTimeout(1000000); // Set timeout to 5 minutes (in milliseconds)
initSocket(httpServer);
connectDb()
	.then(() => {
		httpServer.listen(port, () => {
			logger.info(`Server is running at port ${port}`);
		});
	})
	.catch((err) => {
		logger.error(`Connection to the database failed due to ${err}`);
	});

app.use(errorHandler);