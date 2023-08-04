import { Block, type BlockInput } from '../Block';
import { type WaitElementInput } from './WaitElement';
export declare class ClickElement extends Block {
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
    execute(input: ClickElementInput): Promise<void>;
}
export type ClickElementInput = BlockInput & WaitElementInput;
//# sourceMappingURL=ClickElement.d.ts.map