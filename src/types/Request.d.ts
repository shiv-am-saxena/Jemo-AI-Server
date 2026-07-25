import { User } from './models/User'; // Example import

declare global {
	namespace Express {
		interface Request {
			user?: User;
		}
	}
}
