import assert from 'assert';
import {Block, type BlockInput} from '../Block';
import {WaitElement, type WaitElementInput} from './WaitElement';

export class ClickElement extends Block {
	static metadata = {
		name: 'ClickElement',
		description: 'ClickElement',
		message: {
			success: 'ClickElement successfully',
			error: 'ClickElement failed',
			pending: 'ClickElement pending',
		},
	};

	type = 'content' as const;

	async execute(input: ClickElementInput) {
		const elements = await this.executeNode(WaitElement, input);
		if (elements?.[0]) {
			assert(elements[0] instanceof HTMLElement);
			elements[0].click();
		}
	}
}

export type ClickElementInput = BlockInput & WaitElementInput;
