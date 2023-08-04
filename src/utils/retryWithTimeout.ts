export async function retryWithTimeout<
	T extends (...args: any[]) => Promise<V>,
	V = Awaited<ReturnType<T>>,
>(
	fn: T,
	args: Parameters<T>,
	timeout: number,
	retryInterval = 200,
): Promise<V> {
	return new Promise<V>((resolve, reject) => {
		let isSettled = false;
		let lastErrorMessage = '';

		const timeoutId = setTimeout(() => {
			isSettled = true;
			reject(
				new Error(`Timeout ${timeout}ms, last error: ${lastErrorMessage}`),
			);
		}, timeout);

		const repeat = () => {
			if (isSettled) {
				return;
			}

			fn(...args)
				.then(result => {
					clearTimeout(timeoutId);
					resolve(result);
				})
				.catch(error => {
					lastErrorMessage = (error as Error).message;
					setTimeout(repeat, retryInterval);
				});
		};

		repeat();
	});
}
