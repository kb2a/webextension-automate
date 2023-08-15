import browser from 'webextension-polyfill';
import {Block, type BlockInput} from '../Block';

export class CloseTab extends Block {
	type = 'background' as const;

	async execute(input: CloseTabInput) {
		if (input.tabIds) {
			await browser.tabs.remove(input.tabIds);
		} else {
			const tabId = await browser.tabs.query({active: true}).then(tabs => tabs[0].id);
			if (tabId)
				await browser.tabs.remove(tabId);
		}
		const tabId = await browser.tabs.query({active: true}).then(tabs => tabs[0].id);

		this.context.activeTab.id = tabId ?? -1;
	}
}

export type CloseTabInput = BlockInput & {
	tabIds?: number[];
};
