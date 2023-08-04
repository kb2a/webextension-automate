import { sleep } from '../utils';
export class Node {
    engine;
    logger;
    context;
    static get metadata() {
        return {
            name: this.name,
            description: this.name,
            message: {
                success: `Node ${this.name} executed successfully`,
                error: `Node ${this.name} failed to execute`,
                pending: `Node ${this.name} is executing`,
            },
        };
    }
    constructor(engine, logger, context) {
        this.engine = engine;
        this.logger = logger;
        this.context = context;
    }
    async executeConcurrentNodes(nodes) {
        return Promise.all(nodes.map(async (node) => this.executeNode(node.Node, node.input)));
    }
    async executeNodes(nodes, delay = 0) {
        const results = [];
        for (const node of nodes) {
            await sleep(delay);
            const result = await this.executeNode(node.Node, node.input);
            results.push(result);
        }
        return results;
    }
    async executeNode(NodeClass, input) {
        return this.engine.executeNode({
            name: NodeClass.name,
            data: input,
        }, this.logger, this.context);
    }
}
//# sourceMappingURL=Node.js.map