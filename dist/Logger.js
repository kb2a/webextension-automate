import { nanoid } from 'nanoid';
export class Logger {
    id = nanoid();
    data;
    children = new Array();
    rootLogger;
    parentLogger;
    constructor(isRoot = false) {
        if (isRoot) {
            this.rootLogger = this;
        }
    }
    add(logData, parentId) {
        const logger = new Logger();
        logger.data = logData;
        logger.rootLogger = this.rootLogger ?? this;
        logger.parentLogger = this;
        if (parentId) {
            const parent = this.rootLogger?.find(parentId);
            if (parent) {
                parent.children.push(logger);
            }
            else {
                throw new Error(`Parent logger with id "${parentId}" not found`);
            }
        }
        else {
            this.children.push(logger);
        }
        return logger;
    }
    remove(id) {
        const index = this.children.findIndex(log => log.id === id);
        if (index === -1) {
            const logger = this.rootLogger?.find(id);
            logger?.parentLogger?.remove(id);
        }
        else {
            this.children.splice(index, 1);
        }
    }
    find(id) {
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
    update(id, logData) {
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
    toJSON() {
        return {
            id: this.id,
            ...this.data,
            children: this.children.map(child => child.toJSON()),
        };
    }
    importJSON(data) {
        this.id = data.id;
        this.data = data;
        this.children = data.children.map(child => {
            const logger = new Logger();
            logger.importJSON(child);
            return logger;
        });
    }
}
//# sourceMappingURL=Logger.js.map