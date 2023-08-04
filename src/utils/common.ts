export function toCamelCase(str: string, capitalize = false) {
	const result = str.replace(
		/(?:^\w|[A-Z]|\b\w)/g,
		(letter: string, index: number) =>
			index === 0 && !capitalize ? letter.toLowerCase() : letter.toUpperCase(),
	);

	return result.replace(/\s+|[-]/g, '');
}

export function isWhitespace(str: string) {
	return !/\S/.test(str);
}

export async function sleep(timeout = 500): Promise<void> {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, timeout);
	});
}
