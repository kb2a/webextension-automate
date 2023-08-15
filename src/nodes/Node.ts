/* eslint-disable no-await-in-loop */
import {type LogData} from '../utils/logger';
import {type NodeRaw, type Context, type Engine} from '../Engine';
import {type Logger} from '../Logger';
import {sleep} from '../utils';

export abstract class Node {
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

	/**
	 * Environment that the node will execute in.
	 * Type 'content': execute in content pages, can use dom variable like: HTMLElement, HTMLElementInput, ...
	 * Type 'background': execute in background or popup, can use functions from: browser.tabs, browser.runtime, ...
	 * @description Environment that the node will execute in
	 */
	abstract type: 'background' | 'content' | 'universal';

	constructor(
		public engine: Engine,
		public logger: Logger<LogData>,
		public context: Context,
	) {}

	async executeConcurrentNodes<T extends typeof Node>(
		nodes: Array<{
			Node: typeof Node;
			input: any; // TODO: add type base on T and lying in an array, need help
		}>,
	) {
		return Promise.all(
			nodes.map(async node => this.executeNode(node.Node, node.input)),
		);
	}

	async executeNodes<T extends typeof Node = typeof Node>(
		nodes: Array<{
			Node: T;
			input: Parameters<InstanceType<T>['execute']>[0];
		}>,
		delay = 0,
	) {
		const results: Awaited<ReturnType<InstanceType<T>["execute"]>>[] = [];
		for (const node of nodes) {
			await sleep(delay);
			const result = await this.executeNode(node.Node, node.input);
			results.push(result);
		}

		return results;
	}

	async executeNode<T extends typeof Node>(
		NodeClass: T,
		input: Parameters<InstanceType<T>['execute']>[0],
	) {
		// Pass NodeClass instead of NodeClass.name to support outside module import Node blocks
		return this.engine.executeNode(
			{
				name: NodeClass.name,
				data: input,
			} as NodeRaw,
			this.logger,
			this.context,
		) as Promise<ReturnType<InstanceType<T>['execute']>>;
	}

	abstract execute(input: NodeInput): Promise<any>;
}

export type NodeInput = {
	delay?: number;
};

export type NodeMetadata = typeof Node.metadata;
