import * as BlockClassifiers from './blocks';

export * from './Node';
export * from './Block';
export * from './Job';
export * from './blocks';

export const NodeClassifiers = {
	...BlockClassifiers,
};

export type NodeNameUnion = keyof typeof NodeClassifiers;

/**
 * Get the execute function of a node by its name
 * @param NodeName The name of the node
 * @returns The execute function of the node
 */
export type GetNodeExecuteFn<NodeName extends NodeNameUnion> = InstanceType<
(typeof NodeClassifiers)[NodeName]
>['execute'];

/**
 * Get the input of a node by its name
 * @param NodeName The name of the node
 * @returns The input of the node
 */
export type GetNodeInput<NodeName extends NodeNameUnion> = Parameters<
GetNodeExecuteFn<NodeName>
>[0];

/**
 * Get the output of a node by its name
 * @param NodeName The name of the node
 * @returns The output of the node
 */
export type GetNodeOutput<NodeName extends NodeNameUnion> = Awaited<
ReturnType<GetNodeExecuteFn<NodeName>>
>;
