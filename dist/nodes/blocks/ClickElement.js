import { assert } from '../../utils/assert';
import { Block } from '../Block';
import { WaitElement } from './WaitElement';
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
    type = 'content';
    async execute(input) {
        const elements = await this.executeNode(WaitElement, input);
        if (elements[0]) {
            assert(elements[0] instanceof HTMLElement);
            elements[0].click();
        }
    }
}
//# sourceMappingURL=ClickElement.js.map