// @ts-ignore
import { isAxiosError } from 'axios';

//TODO to type error handler
export const errorHandler = (error: unknown, description: string, log = true) => {
	if (isAxiosError(error)) {
		if (log) {
			// @ts-ignore
			console.error(description, error.response?.data);
		}
		// @ts-ignore
		return error.response?.data;
	} else {
		// if error not axios error, use generic error
		console.error('Unknown error:', error);
		throw new Error(
			'Error fetching raw transaction: ' +
				(error instanceof Error ? error.message : String(error))
		);
	}
};
