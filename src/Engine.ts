/* eslint-disable no-await-in-loop */
import browser, {type Runtime} from 'webextension-polyfill';
import to from 'await-to-js';
import {type LogData, logPending, logSuccess, logError} from './utils/logger';
import type {
	Node,
	NodeMetadata,
	NodeNameUnion,
	GetNodeOutput,
	GetNodeInput,
	JobInput,
} from './nodes';
import {Logger} from './Logger';
import {sleep, waitTabLoaded} from './utils';
import {NodeClassifiers, Job} from './nodes';

const TAB_ID_NONE = -1;

/**
 * @description Context engine for Jobs and Blocks
 */
export class Engine {
	/**
	 * @description Create context for executing Nodes
	 * @param additionalContext Additional context for executing Nodes
	 */
	static createContext(additionalContext: Record<string, unknown> = {}) {
		return {
			rootLogId: 0,
			windowId: 0,
			activeTab: {
				id: TAB_ID_NONE,
				url: '',
			},
			...additionalContext,
		};
	}

	/**
	 * @description Detect environment of Engine
	 * @example
	 * // In background script
	 * Engine.detectEnvironment(); // 'background'
	 * // In content script
	 * Engine.detectEnvironment(); // 'content'
	 */
	static detectEnvironment() {
		if (
			chrome?.extension?.getBackgroundPage
			&& chrome.extension.getBackgroundPage() === window
		) {
			return 'background';
		}

		if (
			chrome?.extension?.getBackgroundPage
			&& chrome.extension.getBackgroundPage() !== window
		) {
			return 'popup';
		}

		if (!chrome?.runtime?.onMessage) {
			return 'web';
		}

		return 'content';
	}

	NodeClassifiers = new Map<string, typeof Node>();

	/**
	 * @description Create new instance of Engine
	 * @param environment Specify environment of Engine, 'background' or 'content'
	 * @example
	 * // In background script
	 * const engine = new Engine('background');
	 * engine.executeTask(taskRaw);
	 * @example
	 * // In content script
	 * const engine = new Engine('content');
	 * engine.executeTask(taskRaw);
	 */
	constructor(
		public environment:
		| 'background'
		| 'content'
		| 'popup'
		| 'web' = Engine.detectEnvironment(),
	) {
		Object.values(NodeClassifiers).forEach(NodeClassifier => {
			this.NodeClassifiers.set(NodeClassifier.name, NodeClassifier);
		});
	}

	registerNodes(Nodes: Record<string, typeof Node>) {
		Object.keys(Nodes).forEach(key => {
			if (this.NodeClassifiers.has(key)) {
				throw new Error(`Node "${key}" already registered`);
			}

			this.NodeClassifiers.set(key, Nodes[key]);
		});
	}

	/**
	 * @description Create hook for listening others job message from any environments
	 * @example
	 * // In background script
	 * const engine = new Engine('background');
	 * browser.runtime.onMessage.addListener(engine.createHook());
	 */
	createHook() {
		return async (hookInput: HookInput, sender: Runtime.MessageSender) =>
			new Promise<HookOutput>((resolve, reject) => {
				console.log('Received from message from other: ', hookInput);

				if (!hookInput?.type || !hookInput.data) {
					reject(new Error('Invalid message format'));
				}

				switch (hookInput.type) {
					case 'node': {
						const {context, nodeRaw} = hookInput.data;
						const logger = new Logger<LogData>(true);

						this.executeNode(nodeRaw, logger, context)
							.then(output => {
								resolve({
									output,
									logData: logger.toJSON(),
									context,
								});
							})
							.catch(reject);
						break;
					}

					case 'number': {
						if (hookInput.data === 'getCurrentTabId') {
							resolve(sender.tab?.id ?? -1);
						}

						break;
					}

					default:
						reject(new Error('Unknown hook input type'));
						break;
				}
			});
	}

	async sendMessageToTab<T extends HookInput>(tabId: number, hookInput: T) {
		try {
			const result = await browser.tabs.sendMessage(tabId, hookInput) as Promise<
				GetHookOutput<typeof hookInput>
			>;
			return result;
		}
		catch (error) {
			throw new Error(`Hook error: ${(error as Error).message}. Does content script registered this node?`);
		}
	}

	async sendMessageToBackground<T extends HookInput>(hookInput: T) {
		try {
			const result = await browser.runtime.sendMessage(hookInput) as Promise<
				GetHookOutput<typeof hookInput>
			>;
			return result;
		}
		catch (error) {
			throw new Error(`Hook error: ${(error as Error).message}. Does background script registered this node?`);
		}
	}

	/**
	 * @description Execute task from raw data, all nodes will be executed in order and use the same context
	 * @param taskRaw Task raw data
	 * @param logger Logger for logging task
	 * @param context Context for executing Nodes
	 */
	async executeTaskRaw<NodeName extends NodeNameUnion>(
		taskRaw: NodeMetadata & {
			data: {
				nodes: Array<NodeRaw<NodeName>>;
			};
		},
		logger = new Logger<LogData>(true),
		context = Engine.createContext(),
	) {
		const taskLogger = logPending(logger, taskRaw);
		const [error] = await to(
			this.executeNodes(taskRaw.data.nodes, taskLogger, context),
		);
		if (error) {
			logError(taskLogger, taskRaw, error);
		} else {
			logSuccess(taskLogger, taskRaw);
		}

		console.log(taskLogger.toJSON());
		return logger;
	}

	/**
	 * @description Execute task from specified Node Class, all nodes will be executed in order and use the same context
	 * @param taskRaw Task data
	 * @param logger Logger for logging task
	 * @param context Context for executing Nodes
	 */
	async executeTask<T extends typeof Node>(
		taskData: NodeMetadata & {
			data: {
				nodes: Array<{
					Node: T;
					data: Parameters<InstanceType<T>['execute']>[0];
				}>;
			};
		},
		logger = new Logger<LogData>(true),
		context = Engine.createContext(),
	) {
		const taskLogger = logPending(logger, taskData);
		const results: any[] = [];

		try {
			for (const nodeData of taskData.data.nodes) {
				// @ts-expect-error cannot use new with abstract class
				const node = new nodeData.Node(this, taskLogger, context) as Node;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				const result = await node.execute(nodeData.data);
				results.push(result);
			}
		} catch (error) {
			logError(taskLogger, taskData, error as Error);
		}

		logSuccess(taskLogger, taskData);
		console.log(taskLogger.toJSON());
		return logger;
	}

	/**
	 * @description Execute concurrent nodes, all nodes will be executed concurrently and use the same context
	 * @param nodeRaws Node raw data
	 * @param logger Logger for logging task
	 * @param context Context for executing Nodes
	 * @example
	 * // In background script
	 * const engine = new Engine('background');
	 * await engine.executeConcurrentNodes([
	 *  {
	 *    name: 'NewTab',
	 *    data: {
	 *      url: 'https://twitter.com/KB2A_vn',
	 *      active: true,
	 *      waitTabLoaded: true,
	 *      updatePrevTab: false,
	 *      tabLoadTimeout: 30000,
	 *    },
	 *  },
	 *  {
	 *    name: 'NewTab',
	 *    data: {
	 *      url: 'https://kb2a.vn/',
	 *      active: true,
	 *      waitTabLoaded: true,
	 *      updatePrevTab: false,
	 *      tabLoadTimeout: 30000,
	 *    },
	 *  },
	 * ]);
	 */
	async executeConcurrentNodes<NodeName extends NodeNameUnion>(
		nodeRaws: Array<NodeRaw<NodeName>>,
		logger: Logger<LogData>,
		context: Context,
	) {
		return Promise.all(
			nodeRaws.map(async nodeRaw =>
				this.executeNode(nodeRaw, logger, context),
			),
		);
	}

	/**
	 * @description Execute nodes, all nodes will be executed in order and use the same context
	 * @param nodeRaws Node raw data
	 * @param logger Logger for logging task
	 * @param context Context for executing Nodes
	 * @param delay Delay between nodes
	 * @example
	 * // In background script
	 * const engine = new Engine('background');
	 * await engine.executeNodes([
	 *  {
	 *    name: 'NewTab',
	 *    data: {
	 *      url: 'https://twitter.com/KB2A_vn',
	 *      active: true,
	 *      waitTabLoaded: true,
	 *      updatePrevTab: false,
	 *      tabLoadTimeout: 30000,
	 *    },
	 *  },
	 *  {
	 *   name: 'NewTab',
	 *   data: {
	 *     url: 'https://kb2a.vn/',
	 *     active: true,
	 *     waitTabLoaded: true,
	 *     updatePrevTab: false,
	 *     tabLoadTimeout: 30000,
	 *   },
	 *  },
	 * ]);
	 */
	async executeNodes<NodeName extends NodeNameUnion>(
		nodeRaws: Array<NodeRaw<NodeName>>,
		logger: Logger<LogData>,
		context: Context,
		delay = 0,
	) {
		const results: Array<GetNodeOutput<NodeName> | undefined> = [];
		for (const nodeRaw of nodeRaws) {
			await sleep(delay);
			const result = await this.executeNode(nodeRaw, logger, context);
			results.push(result);
		}

		return results;
	}

	async executeNode<NodeName extends NodeNameUnion>(
		nodeRaw: NodeRaw<NodeName>,
		logger: Logger<LogData>,
		context: Context,
	): Promise<GetNodeOutput<NodeName>> {
		const NodeClassifier = this.NodeClassifiers.get(nodeRaw.name);
		if (!NodeClassifier) {
			throw new Error(`Node "${nodeRaw.name}" not found`);
		}

		const {metadata} = NodeClassifier;
		const nodeLogger = logPending(logger, metadata);
		// Need to assert node to extends Node class
		// @ts-expect-error cannot use new with abstract class
		const node = new NodeClassifier(this, nodeLogger, context) as Node;
		// Use "as Node" to not using union type of NodeClassifiers, Ex: node.type will be 'background' | 'content' if not using "as Node"

		try {
			// If node is Job and current active tab is none, create new tab
			if (
				node instanceof Job
				&& node.type === 'content' // Only create new tab in job typed content
				&& context.activeTab.id === TAB_ID_NONE
				&& !(node instanceof NodeClassifiers.NewTab) // Create init tab in a NewTab node? No!
				&& this.environment !== 'popup' // Popup process will not be killed (newtab kill popup) before sending hookInput to background
			) {
				const {initUrl} = nodeRaw.data as JobInput;
				if (!initUrl) {
					throw new Error(
						'Job Context: No active tab found, you should specify "initUrl"',
					);
				}

				await this.executeNode(
					{
						name: 'NewTab',
						data: {
							url: initUrl,
							active: true,
							waitTabLoaded: true,
							updatePrevTab: false,
							tabLoadTimeout: 30000,
						},
					},
					new Logger(true),
					context,
				);
				// Pass engine to ensure that it engine environment match with current
				// Pass context because NewTab changes context.activeTab.id
			}

			const hookInput = {
				type: 'node' as const,
				data: {nodeRaw, context},
			};
			let hookOutput: GetHookOutput<typeof hookInput> | undefined;

			if (this.environment === 'content') {
				const currentExecutingTabId = await this.sendMessageToBackground({
					type: 'number',
					data: 'getCurrentTabId',
				});

				if (
					(node.type === 'content'
						&& currentExecutingTabId !== context.activeTab.id)
					|| node.type === 'background'
				) {
					hookOutput = await this.sendMessageToBackground(hookInput); // Send to background and then background send to tab
				}
			}

			if (this.environment === 'background') {
				if (context.activeTab.id !== TAB_ID_NONE) {
					await waitTabLoaded({tabId: context.activeTab.id});
				}

				if (node.type === 'content') {
					hookOutput = await this.sendMessageToTab(
						context.activeTab.id,
						hookInput,
					);
				}
			}

			if (this.environment === 'popup') {
				// Popup process will be killed when creating new tab so we need to send message to background
				hookOutput = await this.sendMessageToBackground(hookInput);
			}

			if (hookOutput) {
				nodeLogger.importJSON(hookOutput.logData.children[0]);
				Object.assign(context, hookOutput.context);
				logSuccess(nodeLogger, metadata);
				return hookOutput.output;
			}

			// Node.type === this.environment || node.type === universal
			await sleep(nodeRaw.data.delay ?? 0);
			const result = (await node.execute(
				nodeRaw.data,
			)) as GetNodeOutput<NodeName>;

			logSuccess(nodeLogger, metadata);
			return result;
		} catch (error) {
			if (error instanceof Error) {
				logError(nodeLogger, metadata, error);
				throw error;
			} else {
				console.error(`Node ${metadata.name}: Unknown error`, error);
				const e = new Error(`Node ${metadata.name}: Unknown error`);
				logError(nodeLogger, metadata, e);
				throw e;
			}
		}
	}
}

export type Context = ReturnType<typeof Engine.createContext>;

export type NodeRaw<NodeName extends NodeNameUnion = NodeNameUnion> = {
	name: NodeName;
	data: GetNodeInput<NodeName>;
};

// Hook input
export type HookInputNode = {
	type: 'node';
	data: {
		nodeRaw: NodeRaw;
		context: Context;
	};
};
export type HookInputNumber = {
	type: 'number';
	data: any;
};
export type HookInput = HookInputNode | HookInputNumber;

// Hook output
export type HookOutputNode<NodeName extends NodeNameUnion = NodeNameUnion> = {
	output: GetNodeOutput<NodeName>;
	logData: ReturnType<Logger<LogData>['toJSON']>;
	context: Context;
};
export type HookOutput = HookOutputNode | number;

/**
 * @description Get hook output type from hook input type
 * @example
 * type HookInput = {
 *  type: 'node';
 *  data: {
 *   nodeRaw: {
 *    name: 'NewTab';
 *    data: {
 *     url: string;
 *     ...
 *    };
 *   };
 *   context: Context;
 *  };
 * } | {
 *  type: 'number';
 *  data: any;
 * };
 * type HookOutput = GetHookOutput<HookInput>;
 * // HookOutput = HookOutputNode<'NewTab'> | number
 */
export type GetHookOutput<HookInput> = HookInput extends {
	type: 'node';
	data: {
		nodeRaw: {name: infer NodeName extends NodeNameUnion};
	};
}
	? HookOutputNode<NodeName>
	: HookInput extends {
		type: 'number';
	  }
		? number
		: never;
