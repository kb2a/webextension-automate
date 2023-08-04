import browser, {type WebNavigation} from 'webextension-polyfill';

export async function waitTabLoaded({
	tabId,
	listenError = false,
	ms = 10000,
}: {
	tabId: number;
	listenError?: boolean;
	ms?: number;
}): Promise<void> {
	return new Promise((resolve, reject) => {
		let timeout: number;
		const excludeErrors = ['net::ERR_BLOCKED_BY_CLIENT', 'net::ERR_ABORTED'];

		const onErrorOccurred = (
			details: WebNavigation.OnErrorOccurredDetailsType,
		) => {
			if (
				details.tabId !== tabId
				|| details.frameId !== 0
				// @ts-expect-error Error is not in the type
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				|| excludeErrors.includes(details.error)
			) {
				return;
			}

			clearTimeout(timeout);
			browser.webNavigation.onErrorOccurred.removeListener(onErrorOccurred);
			// @ts-expect-error Error is not in the type
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
