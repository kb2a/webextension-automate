import browser from 'webextension-polyfill';
import {Block, type BlockInput} from '../Block';

export class ReloadTab extends Block {
	type = 'background' as const;

	async execute(input: ReloadTabInput) {
		await browser.tabs.reload(input.tabId, {
			bypassCache: true,
		});
	}
}

export type ReloadTabInput = BlockInput & {
	tabId: number;
};
