import { Response, NextFunction, Request } from 'express';
import { RequestHandler } from '../types/requestHandler';

const asyncHandler = (requestHandler: RequestHandler) => {
    return (req: Request, res: Response, next: NextFunction): void | Promise<void> => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    };
};

export { asyncHandler };
