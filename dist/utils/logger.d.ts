import type { Logger } from '../Logger';
import { type NodeMetadata } from '../nodes/Node';
export declare function logPending(logger: Logger<LogData>, metadata: NodeMetadata): Logger<LogData>;
export declare function logUpdate(logger: Logger<LogData>, logData: Partial<LogData>): void;
export declare function logError(logger: Logger<LogData>, metadata: NodeMetadata, error: Error): void;
export declare function logSuccess(logger: Logger<LogData>, metadata: NodeMetadata): void;
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
//# sourceMappingURL=logger.d.ts.map