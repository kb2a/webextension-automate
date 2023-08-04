import { Block, type BlockInput } from '../Block';
export declare class WaitElement extends Block {
    static metadata: {
        name: string;
        description: string;
        message: {
            success: string;
            error: string;
            pending: string;
        };
    };
    type: "content";
    execute(input: WaitElementInput): Promise<WaitElementOutput>;
    waitElement({ type, input, }: WaitElementInput): Promise<WaitElementOutput | undefined>;
}
export type WaitElementInput = BlockInput & ({
    type: 'css-selector';
    input: string;
} | {
    type: 'xpath';
    input: string;
} | {
    type: 'search';
    input: {
        body: string;
    };
} | {
    type: 'function';
    input: () => void | Promise<void>;
}) & {
    timeout?: number;
};
export type WaitElementOutput = Element[];
//# sourceMappingURL=WaitElement.d.ts.map