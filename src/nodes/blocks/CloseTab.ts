import browser from 'webextension-polyfill';
import assert from 'assert';
import {Block, type BlockInput} from '../Block';
import {NewTab} from './NewTab';

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
