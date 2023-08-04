import { type BlockInput, Block } from '../Block';
export declare class NewTab extends Block {
    static metadata: {
        name: string;
        description: string;
        message: {
            success: string;
            error: string;
            pending: string;
        };
    };
    type: "background";
    execute(input: NewTabInput): Promise<NewTabOutput>;
}
export type NewTabInput = BlockInput & {
    url: string;
    active: boolean;
    updatePrevTab: boolean;
    waitTabLoaded: boolean;
    tabLoadTimeout: number;
};
export type NewTabOutput = {
    url: string;
    tabId: number | undefined;
};
//# sourceMappingURL=NewTab.d.ts.map