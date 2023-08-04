import {nanoid} from 'nanoid';

export class Logger<DataType extends Record<string, Serializable>> {
	id = nanoid();
	data!: DataType;

	children = new Array<Logger<DataType>>();
	rootLogger: Logger<DataType> | undefined;
	parentLogger: Logger<DataType> | undefined;

	constructor(isRoot = false) {
		if (isRoot) {
			this.rootLogger = this;
		}
	}

	/**
	 * @description Add new log to logger
	 * @param logData Data of log
	 * @param parentId Id of parent logger
	 * @returns New logger
	 * @example
	 * const logger = new Logger<{type: string, message: string}>(true);
	 * logger.add({
	 *  type: 'info',
	 *  message: 'Hello world',
	 * });
	 */
	add(logData: DataType, parentId?: string) {
		const logger = new Logger<DataType>();
		logger.data = logData;
		logger.rootLogger = this.rootLogger ?? this; // "?? this" is for when user forgot to pass isRoot true to the root logger
		logger.parentLogger = this;

		if (parentId) {
			const parent = this.rootLogger?.find(parentId);
			if (parent) {
				parent.children.push(logger);
			} else {
				throw new Error(`Parent logger with id "${parentId}" not found`);
			}
		} else {
			this.children.push(logger);
		}

		return logger;
	}

	/**
	 * @description Remove logger by id
	 * @param id Id of logger
	 * @example
	 * const logger = new Logger<{type: string, message: string}>(true);
	 * logger.add({
	 *  type: 'info',
	 *  message: 'Hello world',
	 * });
	 * logger.remove(logger.children[0]);
	 * logger.children[0].id; // undefined
	 */
	remove(id: string) {
		const index = this.children.findIndex(log => log.id === id);
		if (index === -1) {
			const logger = this.rootLogger?.find(id);
			logger?.parentLogger?.remove(id);
		} else {
			this.children.splice(index, 1);
		}
	}

	/**
	 * @description Find logger by id
	 * @param id Id of logger
	 * @example
	 * const logger = new Logger<{type: string, message: string}>(true);
	 * logger.add({
	 *  type: 'info',
	 *  message: 'Hello world',
	 * });
	 * logger.find(logger.children[0].id); // logger.children[0]
	 * logger.find('not-found'); // undefined
	 */
	find(id: string): Logger<DataType> | undefined {
		if (this.id === id) {
			return this;
		}

		for (const child of this.children) {
			const result = child.find(id);
			if (result) {
				return result;
			}
		}
	}

	/**
	 * @description Update logger data by id
	 * @param id Id of logger
	 * @param logData Data of logger
	 * @example
	 * const logger = new Logger<{type: string, message: string}>(true);
	 * logger.add({
	 *  type: 'info',
	 *  message: 'Hello world',
	 * });
	 * logger.update(logger.children[0].id, {
	 *  type: 'error',
	 *  message: 'Hello world',
	 * });
	 * logger.children[0].data.type; // 'error'
	 * logger.children[0].data.message; // 'Hello world'
	 */
	update(id: string, logData: Partial<DataType>) {
		const logger = this.rootLogger?.find(id);
		if (logger) {
			logger.data = {
				...logger.data,
				...logData,
			};
		}
	}

	clear() {
		this.children = [];
	}

	toJSON(): DataType & {
		id: string;
		children: Array<GetLoggerJSONType<DataType>>;
	} {
		return {
			id: this.id,
			...this.data,
			children: this.children.map(child => child.toJSON()),
		};
	}

	importJSON(data: GetLoggerJSONType<DataType>) {
		this.id = data.id;
		this.data = data;

		this.children = data.children.map(child => {
			const logger = new Logger<DataType>();
			logger.importJSON(child);
			return logger;
		});
	}
}

export type GetLoggerJSONType<DataType extends Record<string, Serializable>> =
	ReturnType<Logger<DataType>['toJSON']>;

export type Serializable =
	| string
	| number
	| boolean
	| undefined
	| Serializable[]
	| {
		[key: string]: Serializable;
	  };
