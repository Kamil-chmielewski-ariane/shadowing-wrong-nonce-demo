import fs from 'fs';
import { format } from 'date-fns';

export async function writeLogFile(path: string, data: any, withTimeStamp = true) {
	const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm');
	fs.appendFile(`${path}`, `${withTimeStamp ? `${timestamp}:` : ''} ${data}`, 'utf-8', (err) => {
		if (err) {
			console.error(err);
			return;
		}
	});
}
