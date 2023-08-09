import { assert } from "./assert"

export function colorBorder(elements: Element | Element[], color: string): () => void {
	// @ts-expect-error Element is not assignable to HTMLElement
	const elements2: HTMLElement[] = Array.isArray(elements) ? elements : [elements];

	const oldBorders = elements2.map(element => {
		assert(element instanceof HTMLElement, 'One of elements\'s item is not instanceof HTMLElement');
		const oldBorder = element.style.border;
		element.style.border = '1px solid green';
		return oldBorder;
	});

	return () => {
		oldBorders.forEach((oldBorder, index) => {
			elements2[index].style.border = oldBorder;
		});
	};
}
