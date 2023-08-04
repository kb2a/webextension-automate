export function getElementsByBody(body) {
    return getElementsByXPath(`//*[contains(text(), "${body}")]`);
}
export function getElementsByXPath(xpath, parent) {
    const results = new Array();
    const query = document.evaluate(xpath, parent ?? document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i = 0, length = query.snapshotLength; i < length; ++i) {
        const node = query.snapshotItem(i);
        if (node instanceof Element) {
            results.push(node);
        }
    }
    return results;
}
//# sourceMappingURL=queryDOM.js.map