import browser from 'webextension-polyfill';
import { Block } from '../Block';
export class CloseTab extends Block {
    type = 'background';
    async execute(input) {
        await browser.tabs.remove(input.tabIds);
        this.context.activeTab.id = -1;
    }
}
//# sourceMappingURL=CloseTab.js.map