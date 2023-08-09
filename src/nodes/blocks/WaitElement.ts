import { assert, colorBorder, sleep } from '../../utils'
import {getElementsByBody, getElementsByXPath} from '../../utils/queryDOM';
import {retryWithTimeout} from '../../utils/retryWithTimeout';
import {Block, type BlockInput} from '../Block';

export class WaitElement extends Block {
	static metadata = {
		name: 'Wait element',
		description: 'Wait for element',
		message: {
			success: 'Found element',
			error: 'Element not found',
			pending: 'Waiting for element',
		},
	};

	type = 'content' as const;

	async execute(input: WaitElementInput): Promise<WaitElementOutput> {
		const elements = await retryWithTimeout(
			this.waitElement.bind(this),
			[input],
			input.timeout ?? 10000,
		);
		if (!elements) {
			throw new Error('Block WaitElement: Element not found}');
		}

		return elements;
	}

	async waitElement({
		type,
		input,
	}: WaitElementInput): Promise<WaitElementOutput | undefined> {
		let elements: Element[];
		
		if (type === 'css-selector') {
			elements = Array.from(document.querySelectorAll(input));
			if (elements.length === 0) {
				throw new Error(
					`Block WaitElement: Element css-selector "${input}" not found}`,
				);
			}
		}

		if (type === 'search') {
			elements = getElementsByBody(input.body);
			if (elements.length === 0) {
				throw new Error(
					`Block WaitElement: Element contains "${input.body}" not found}`,
				);
			}
		}

		if (type === 'xpath') {
			elements = getElementsByXPath(input);
			if (elements.length === 0) {
				throw new Error(
					`Block WaitElement: Element with xpath "${input}" not found}`,
				);
			}
		}

		const revert = colorBorder(elements!, '1px solid green');
		await sleep(2000);
		revert();
		return elements!;
	}
}

export type WaitElementInput = BlockInput &
(
	| {
		type: 'css-selector';
		input: string;
		  }
	| {
		type: 'xpath';
		input: string;
		  }
	| {
		type: 'search';
		input: {
			body: string;
		};
		  }
	| {
		type: 'function';
		input: () => void | Promise<void>;
		  }
) & {
	timeout?: number;
};

export type WaitElementOutput = Element[];
