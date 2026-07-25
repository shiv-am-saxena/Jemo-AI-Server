import { Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { Request } from '../types/Request';

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
