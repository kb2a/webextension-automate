import * as BlockClassifiers from './blocks';
export * from './Node';
export * from './Block';
export * from './Job';
export * from './blocks';
export declare const NodeClassifiers: {
    ClickElement: typeof BlockClassifiers.ClickElement;
    CloseTab: typeof BlockClassifiers.CloseTab;
    NewTab: typeof BlockClassifiers.NewTab;
    WaitElement: typeof BlockClassifiers.WaitElement;
};
export type NodeNameUnion = keyof typeof NodeClassifiers;
export type GetNodeExecuteFn<NodeName extends NodeNameUnion> = InstanceType<(typeof NodeClassifiers)[NodeName]>['execute'];
export type GetNodeInput<NodeName extends NodeNameUnion> = Parameters<GetNodeExecuteFn<NodeName>>[0];
export type GetNodeOutput<NodeName extends NodeNameUnion> = Awaited<ReturnType<GetNodeExecuteFn<NodeName>>>;
//# sourceMappingURL=index.d.ts.map