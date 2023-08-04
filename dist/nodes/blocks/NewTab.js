import browser from 'webextension-polyfill';
import { isWhitespace } from '../../utils/common';
import { Block } from '../Block';
import { waitTabLoaded } from '../../utils/waitTabLoaded';
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
    type = 'background';
    async execute(input) {
        const isInvalidUrl = !/^https?/.test(input.url);
        if (isInvalidUrl) {
            throw new Error(isWhitespace(input.url) ? 'url-empty' : 'invalid-active-tab');
        }
        const tab = input.updatePrevTab && this.context.activeTab.id
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
        if (input.waitTabLoaded) {
            await waitTabLoaded({
                listenError: true,
                tabId: this.context.activeTab.id,
                ms: input.tabLoadTimeout || 30000,
            });
        }
        if (tab.windowId) {
            await browser.windows.update(tab.windowId, { focused: true });
        }
        return {
            url: input.url,
            tabId: tab.id,
        };
    }
}
//# sourceMappingURL=NewTab.js.map