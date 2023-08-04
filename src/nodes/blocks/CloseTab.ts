import browser from 'webextension-polyfill';
import {Block, type BlockInput} from '../Block';

export class CloseTab extends Block {
	type = 'background' as const;

	async execute(input: CloseTabInput) {
		await browser.tabs.remove(input.tabIds);
		this.context.activeTab.id = -1;
	}
}

export type CloseTabInput = BlockInput & {
	tabIds: number[];
};
