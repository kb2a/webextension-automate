export async function retryWithTimeout(fn, args, timeout, retryInterval = 200) {
    return new Promise((resolve, reject) => {
        let isSettled = false;
        let lastErrorMessage = '';
        const timeoutId = setTimeout(() => {
            isSettled = true;
            reject(new Error(`Timeout ${timeout}ms, last error: ${lastErrorMessage}`));
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
                lastErrorMessage = error.message;
                setTimeout(repeat, retryInterval);
            });
        };
        repeat();
    });
}
//# sourceMappingURL=retryWithTimeout.js.map