import { Block, type BlockInput } from '../Block';
export declare class ReloadTab extends Block {
    type: "background";
    execute(input: ReloadTabInput): Promise<void>;
}
export type ReloadTabInput = BlockInput & {
    tabId: number;
};
//# sourceMappingURL=ReloadTab.d.ts.map