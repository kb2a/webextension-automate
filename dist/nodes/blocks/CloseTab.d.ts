import { Block, type BlockInput } from '../Block';
export declare class CloseTab extends Block {
    type: "background";
    execute(input: CloseTabInput): Promise<void>;
}
export type CloseTabInput = BlockInput & {
    tabIds: number[];
};
//# sourceMappingURL=CloseTab.d.ts.map