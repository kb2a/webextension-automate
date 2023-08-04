import browser from 'webextension-polyfill';
export async function waitTabLoaded({ tabId, listenError = false, ms = 10000, }) {
    return new Promise((resolve, reject) => {
        let timeout;
        const excludeErrors = ['net::ERR_BLOCKED_BY_CLIENT', 'net::ERR_ABORTED'];
        const onErrorOccurred = (details) => {
            if (details.tabId !== tabId
                || details.frameId !== 0
                || excludeErrors.includes(details.error)) {
                return;
            }
            clearTimeout(timeout);
            browser.webNavigation.onErrorOccurred.removeListener(onErrorOccurred);
            reject(new Error(details.error));
        };
        if (ms > 0) {
            timeout = setTimeout(() => {
                browser.webNavigation.onErrorOccurred.removeListener(onErrorOccurred);
                reject(new Error('Timeout'));
            }, ms);
        }
        if (listenError) {
            browser.webNavigation.onErrorOccurred.addListener(onErrorOccurred);
        }
        const activeTabStatus = () => {
            browser.tabs
                .get(tabId)
                .then(tab => {
                if (!tab) {
                    reject(new Error('no-tab'));
                    return;
                }
                if (tab.status === 'loading') {
                    setTimeout(() => {
                        activeTabStatus();
                    }, 1000);
                    return;
                }
                clearTimeout(timeout);
                browser.webNavigation.onErrorOccurred.removeListener(onErrorOccurred);
                resolve();
            })
                .catch(console.error);
        };
        activeTabStatus();
    });
}
//# sourceMappingURL=waitTabLoaded.js.map