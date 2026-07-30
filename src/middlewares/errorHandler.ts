import { Response, NextFunction, Request } from 'express';
import { ApiError } from '../utils/ApiError';


const errorHandler = (
	err: ApiError,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const statusCode = err.statusCode || 500;
	res.status(statusCode).json(err);
};

export default errorHandler;
