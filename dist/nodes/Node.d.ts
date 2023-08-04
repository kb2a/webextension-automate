import { type LogData } from '../utils/logger';
import { type Context, type Engine } from '../Engine';
import { type Logger } from '../Logger';
export declare abstract class Node {
    engine: Engine;
    logger: Logger<LogData>;
    context: Context;
    static get metadata(): {
        name: string;
        description: string;
        message: {
            success: string;
            error: string;
            pending: string;
        };
    };
    abstract type: 'background' | 'content' | 'universal';
    constructor(engine: Engine, logger: Logger<LogData>, context: Context);
    executeConcurrentNodes<T extends typeof Node>(nodes: Array<{
        NodeClass: T;
        input: Parameters<InstanceType<T>['execute']>[0];
    }>): Promise<Awaited<ReturnType<InstanceType<T>["execute"]>>[]>;
    executeNodes<T extends typeof Node>(nodes: Array<{
        NodeClass: T;
        input: Parameters<InstanceType<T>['execute']>[0];
    }>, delay?: number): Promise<Awaited<ReturnType<InstanceType<T>["execute"]>>[]>;
    executeNode<T extends typeof Node>(NodeClass: T, input: Parameters<InstanceType<T>['execute']>[0]): Promise<ReturnType<InstanceType<T>["execute"]>>;
    abstract execute(input: NodeInput): Promise<any>;
}
export type NodeInput = {
    delay?: number;
};
export type NodeMetadata = typeof Node.metadata;
//# sourceMappingURL=Node.d.ts.map