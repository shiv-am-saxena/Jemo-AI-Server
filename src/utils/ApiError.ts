class ApiError extends Error {
	statusCode: number;
	errors?: Array<any>;
	success: boolean;
	message: string;
	data: any;
	stack?: any;
	constructor(
		statusCode: number,
		message: string = 'Something went wrong',
		stack = '',
		errors?: Array<Error>
	) {
		super(message);
		this.statusCode = statusCode;
		this.data = null;
		this.message = message;
		this.success = false;
		this.errors = errors;
		if (stack) {
			this.stack = stack;
		} else {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

export { ApiError };
