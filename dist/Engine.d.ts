import { type Runtime } from 'webextension-polyfill';
import { type LogData } from './utils/logger';
import type { Node, NodeMetadata, NodeNameUnion, GetNodeOutput, GetNodeInput } from './nodes';
import { Logger } from './Logger';
export declare class Engine {
    environment: 'background' | 'content' | 'popup' | 'web';
    static createContext(additionalContext?: Record<string, unknown>): {
        rootLogId: number;
        windowId: number;
        activeTab: {
            id: number;
            url: string;
        };
    };
    static detectEnvironment(): "background" | "content" | "popup" | "web";
    NodeClassifiers: Map<string, typeof Node>;
    constructor(environment?: 'background' | 'content' | 'popup' | 'web');
    registerNode(NodeClass: typeof Node): void;
    createHook(): (hookInput: HookInput, sender: Runtime.MessageSender) => Promise<HookOutput>;
    sendMessageToTab<T extends HookInput>(tabId: number, hookInput: T): Promise<GetHookOutput<T>>;
    sendMessageToBackground<T extends HookInput>(hookInput: T): Promise<GetHookOutput<T>>;
    executeTaskRaw<NodeName extends NodeNameUnion>(taskRaw: NodeMetadata & {
        data: {
            nodes: Array<NodeRaw<NodeName>>;
        };
    }, logger?: Logger<LogData>, context?: {
        rootLogId: number;
        windowId: number;
        activeTab: {
            id: number;
            url: string;
        };
    }): Promise<Logger<LogData>>;
    executeTask<T extends typeof Node>(taskData: NodeMetadata & {
        data: {
            nodes: Array<{
                Node: T;
                data: Parameters<InstanceType<T>['execute']>[0];
            }>;
        };
    }, logger?: Logger<LogData>, context?: {
        rootLogId: number;
        windowId: number;
        activeTab: {
            id: number;
            url: string;
        };
    }): Promise<Logger<LogData>>;
    executeConcurrentNodes<NodeName extends NodeNameUnion>(nodeRaws: Array<NodeRaw<NodeName>>, logger: Logger<LogData>, context: Context): Promise<Awaited<ReturnType<import("./nodes").GetNodeExecuteFn<NodeName>>>[]>;
    executeNodes<NodeName extends NodeNameUnion>(nodeRaws: Array<NodeRaw<NodeName>>, logger: Logger<LogData>, context: Context, delay?: number): Promise<(GetNodeOutput<NodeName> | undefined)[]>;
    executeNode<NodeName extends NodeNameUnion>(nodeRaw: NodeRaw<NodeName>, logger: Logger<LogData>, context: Context): Promise<GetNodeOutput<NodeName>>;
}
export type Context = ReturnType<typeof Engine.createContext>;
export type NodeRaw<NodeName extends NodeNameUnion = NodeNameUnion> = {
    name: NodeName;
    data: GetNodeInput<NodeName>;
};
export type HookInputNode = {
    type: 'node';
    data: {
        nodeRaw: NodeRaw;
        context: Context;
    };
};
export type HookInputNumber = {
    type: 'number';
    data: any;
};
export type HookInput = HookInputNode | HookInputNumber;
export type HookOutputNode<NodeName extends NodeNameUnion = NodeNameUnion> = {
    output: GetNodeOutput<NodeName>;
    logData: ReturnType<Logger<LogData>['toJSON']>;
    context: Context;
};
export type HookOutput = HookOutputNode | number;
export type GetHookOutput<HookInput> = HookInput extends {
    type: 'node';
    data: {
        nodeRaw: {
            name: infer NodeName extends NodeNameUnion;
        };
    };
} ? HookOutputNode<NodeName> : HookInput extends {
    type: 'number';
} ? number : never;
//# sourceMappingURL=Engine.d.ts.map