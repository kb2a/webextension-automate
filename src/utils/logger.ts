import type {Logger} from '../Logger';
import {type NodeMetadata} from '../nodes/Node';

export function logPending(logger: Logger<LogData>, metadata: NodeMetadata) {
	const log = logger.add({
		name: metadata.name,
		description: metadata.description,
		message: metadata.message.pending,
		status: 'pending',
		error: {
			message: '',
			stack: '',
		},
		duration: 0,
		timestamp: Date.now(),
	});

	return log;
}

export function logUpdate(logger: Logger<LogData>, logData: Partial<LogData>) {
	logger.data = {
		...logger.data,
		...logData,
	};
}

export function logError(
	logger: Logger<LogData>,
	metadata: NodeMetadata,
	error: Error,
) {
	logger.data = {
		...logger.data,
		status: 'error',
		message: metadata.message.error ?? error.message,
		error: {
			message: error.message,
			stack: error.stack ?? '',
		},
		duration: Date.now() - logger.data.timestamp,
	};
}

export function logSuccess(logger: Logger<LogData>, metadata: NodeMetadata) {
	logger.data = {
		...logger.data,
		message: metadata.message.success,
		status: 'success',
		duration: Date.now() - logger.data.timestamp,
	};
}

export type LogData = {
	name: string;
	description: string;
	message: string;
	duration: number;
	timestamp: number;
	status: 'pending' | 'success' | 'error';
	error: {
		message: string;
		stack: string;
	};
};
