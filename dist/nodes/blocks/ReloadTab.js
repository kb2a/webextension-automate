import browser from 'webextension-polyfill';
import { Block } from '../Block';
export class ReloadTab extends Block {
    type = 'background';
    async execute(input) {
        await browser.tabs.reload(input.tabId, {
            bypassCache: true,
        });
    }
}
//# sourceMappingURL=ReloadTab.js.map