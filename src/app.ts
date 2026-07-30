import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { apiResponse } from './utils/apiResponse';
import authRouter from './routes/auth.route';
import session from 'express-session';
import passport from './services/passport';
import morgan from 'morgan';
import logger from './services/logger';
import cronRouter from './jobs/storageCleanup';
import chatsRouter from './routes/chats.route';

const app = express();

const morganFormat = ':method :url :status :response-time ms';

app.use(
	morgan(morganFormat, {
		stream: {
			write: (message) => {
				const logObject = {
					method: message.split(' ')[0],
					url: message.split(' ')[1],
					status: message.split(' ')[2],
					responseTime: message.split(' ')[3]
				};
				logger.info(JSON.stringify(logObject));
			}
		}
	})
);
app.use(
	cors({
		origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
		credentials: true
	})
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(
	session({
		secret: process.env.SESSION_SECRET as string,
		resave: false,
		saveUninitialized: false,
		cookie: {
			secure: process.env.NODE_ENV === 'production', // true if using https
			maxAge: 24 * 60 * 60 * 1000 // 1 day
		}
	})
);


// 3. Initialize Passport
app.use(passport.initialize());
app.use(passport.session());



app.get('/', (req: Request, res: Response) => {
	res.json(
		new apiResponse(
			200,
			{
				health: 'ok',
				version: '1.0.0',
				timestamp: new Date().toISOString()
			},
			'Welcome to the Jemo API'
		)
	);
});
app.use('/auth', authRouter);
app.use('/chats', chatsRouter);
app.use('/crons', cronRouter); // Add this line to include the cron routes
export { app };
