import browser, {type Tabs} from 'webextension-polyfill';
import {isWhitespace} from '../../utils/common';
import {type BlockInput, Block} from '../Block';
import {waitTabLoaded} from '../../utils/waitTabLoaded';

export class NewTab extends Block {
	static metadata = {
		name: 'New tab',
		description: 'Create a new tab',
		message: {
			success: 'Open tab successfully',
			error: 'Open tab failed',
			pending: 'Opening tab',
		},
	};

	type = 'background' as const;

	async execute(input: NewTabInput): Promise<NewTabOutput> {
		const isInvalidUrl = !/^https?/.test(input.url);
		if (isInvalidUrl) {
			throw new Error(
				isWhitespace(input.url) ? 'url-empty' : 'invalid-active-tab',
			);
		}

		const tab: Tabs.Tab
      = input.updatePrevTab && this.context.activeTab.id
      	? await browser.tabs.update(this.context.activeTab.id, {
      		url: input.url,
      		active: input.active,
      	})
      	: await browser.tabs.create({
      		url: input.url,
      		active: input.active,
      	});

		this.context.activeTab.url = input.url;

		if (tab.id) {
			this.context.activeTab.id = tab.id;
		}

		// If (this.preloadScripts.length > 0) {
		//   if (this.engine.isMV2) {
		//     await this._sendMessageToTab({
		//       isPreloadScripts: true,
		//       label: 'javascript-code',
		//       data: { scripts: this.preloadScripts },
		//     });
		//   } else {
		//     await injectPreloadScript({
		//       scripts: this.preloadScripts,
		//       frameSelector: this.frameSelector,
		//       target: {
		//         tabId: this.activeTab.id,
		//         frameIds: [this.activeTab.frameId || 0],
		//       },
		//     });
		//   }
		// }

		if (input.waitTabLoaded) {
			await waitTabLoaded({
				listenError: true,
				tabId: this.context.activeTab.id,
				ms: input.tabLoadTimeout || 30000,
			});
		}

		if (tab.windowId) {
			await browser.windows.update(tab.windowId, {focused: true});
		}

		return {
			url: input.url,
			tabId: tab.id,
		};
	}
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
