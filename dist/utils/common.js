export function toCamelCase(str, capitalize = false) {
    const result = str.replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => index === 0 && !capitalize ? letter.toLowerCase() : letter.toUpperCase());
    return result.replace(/\s+|[-]/g, '');
}
export function isWhitespace(str) {
    return !/\S/.test(str);
}
export async function sleep(timeout = 500) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, timeout);
    });
}
//# sourceMappingURL=common.js.map