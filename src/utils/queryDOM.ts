export function getElementsByBody(body: string): Element[] {
	return getElementsByXPath(`//*[contains(text(), "${body}")]`);
}

export function getElementsByXPath(
	xpath: string,
	parent?: Document | Element,
): Element[] {
	const results = new Array<Element>();
	const query = document.evaluate(
		xpath,
		parent ?? document,
		null,
		XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
		null,
	);
	for (let i = 0, length = query.snapshotLength; i < length; ++i) {
		const node = query.snapshotItem(i);
		if (node instanceof Element) {
			results.push(node);
		}
	}

	return results;
}
