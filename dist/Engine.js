import browser from 'webextension-polyfill';
import to from 'await-to-js';
import { logPending, logSuccess, logError } from './utils/logger';
import { Logger } from './Logger';
import { sleep, waitTabLoaded } from './utils';
import { NodeClassifiers, Job } from './nodes';
const TAB_ID_NONE = -1;
export class Engine {
    environment;
    static createContext(additionalContext = {}) {
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
    static detectEnvironment() {
        if (chrome?.extension?.getBackgroundPage
            && chrome.extension.getBackgroundPage() === window) {
            return 'background';
        }
        if (chrome?.extension?.getBackgroundPage
            && chrome.extension.getBackgroundPage() !== window) {
            return 'popup';
        }
        if (!chrome?.runtime?.onMessage) {
            return 'web';
        }
        return 'content';
    }
    NodeClassifiers = new Map();
    constructor(environment = Engine.detectEnvironment()) {
        this.environment = environment;
        Object.values(NodeClassifiers).forEach(NodeClassifier => {
            this.NodeClassifiers.set(NodeClassifier.metadata.name, NodeClassifier);
        });
    }
    registerNode(NodeClass) {
        if (this.NodeClassifiers.has(NodeClass.metadata.name)) {
            throw new Error(`Node "${NodeClass.metadata.name}" already registered`);
        }
        this.NodeClassifiers.set(NodeClass.metadata.name, NodeClass);
    }
    createHook() {
        return async (hookInput, sender) => new Promise((resolve, reject) => {
            console.log('Received from message from other: ', hookInput);
            if (!hookInput?.type || !hookInput.data) {
                reject(new Error('Invalid message format'));
            }
            switch (hookInput.type) {
                case 'node': {
                    const { context, nodeRaw } = hookInput.data;
                    const logger = new Logger(true);
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
    async sendMessageToTab(tabId, hookInput) {
        return browser.tabs.sendMessage(tabId, hookInput);
    }
    async sendMessageToBackground(hookInput) {
        return browser.runtime.sendMessage(hookInput);
    }
    async executeTaskRaw(taskRaw, logger = new Logger(true), context = Engine.createContext()) {
        const taskLogger = logPending(logger, taskRaw);
        const [error] = await to(this.executeNodes(taskRaw.data.nodes, taskLogger, context));
        if (error) {
            logError(taskLogger, taskRaw, error);
        }
        else {
            logSuccess(taskLogger, taskRaw);
        }
        console.log(taskLogger.toJSON());
        return logger;
    }
    async executeTask(taskData, logger = new Logger(true), context = Engine.createContext()) {
        const taskLogger = logPending(logger, taskData);
        const results = [];
        try {
            for (const nodeData of taskData.data.nodes) {
                const node = new nodeData.Node(this, taskLogger, context);
                const result = await node.execute(nodeData.data);
                results.push(result);
            }
        }
        catch (error) {
            logError(taskLogger, taskData, error);
        }
        logSuccess(taskLogger, taskData);
        console.log(taskLogger.toJSON());
        return logger;
    }
    async executeConcurrentNodes(nodeRaws, logger, context) {
        return Promise.all(nodeRaws.map(async (nodeRaw) => this.executeNode(nodeRaw, logger, context)));
    }
    async executeNodes(nodeRaws, logger, context, delay = 0) {
        const results = [];
        for (const nodeRaw of nodeRaws) {
            await sleep(delay);
            const result = await this.executeNode(nodeRaw, logger, context);
            results.push(result);
        }
        return results;
    }
    async executeNode(nodeRaw, logger, context) {
        const NodeClassifier = this.NodeClassifiers.get(nodeRaw.name);
        if (!NodeClassifier) {
            throw new Error(`Node "${nodeRaw.name}" not found`);
        }
        const { metadata } = NodeClassifier;
        const nodeLogger = logPending(logger, metadata);
        const node = new NodeClassifier(this, nodeLogger, context);
        try {
            if (node instanceof Job
                && node.type === 'content'
                && context.activeTab.id === TAB_ID_NONE
                && !(node instanceof NodeClassifiers.NewTab)
                && this.environment !== 'popup') {
                const { initUrl } = nodeRaw.data;
                if (!initUrl) {
                    throw new Error('Job Context: No active tab found, you should specify "initUrl"');
                }
                await this.executeNode({
                    name: 'NewTab',
                    data: {
                        url: initUrl,
                        active: true,
                        waitTabLoaded: true,
                        updatePrevTab: false,
                        tabLoadTimeout: 30000,
                    },
                }, new Logger(true), context);
            }
            const hookInput = {
                type: 'node',
                data: { nodeRaw, context },
            };
            let hookOutput;
            if (this.environment === 'content') {
                const currentExecutingTabId = await this.sendMessageToBackground({
                    type: 'number',
                    data: 'getCurrentTabId',
                });
                if ((node.type === 'content'
                    && currentExecutingTabId !== context.activeTab.id)
                    || node.type === 'background') {
                    hookOutput = await this.sendMessageToBackground(hookInput);
                }
            }
            if (this.environment === 'background') {
                if (context.activeTab.id !== TAB_ID_NONE) {
                    await waitTabLoaded({ tabId: context.activeTab.id });
                }
                if (node.type === 'content') {
                    hookOutput = await this.sendMessageToTab(context.activeTab.id, hookInput);
                }
            }
            if (this.environment === 'popup') {
                hookOutput = await this.sendMessageToBackground(hookInput);
            }
            if (hookOutput) {
                nodeLogger.importJSON(hookOutput.logData.children[0]);
                Object.assign(context, hookOutput.context);
                logSuccess(nodeLogger, metadata);
                return hookOutput.output;
            }
            await sleep(nodeRaw.data.delay ?? 0);
            const result = (await node.execute(nodeRaw.data));
            logSuccess(nodeLogger, metadata);
            return result;
        }
        catch (error) {
            if (error instanceof Error) {
                logError(nodeLogger, metadata, error);
                throw error;
            }
            else {
                console.error(`Node ${metadata.name}: Unknown error`, error);
                const e = new Error(`Node ${metadata.name}: Unknown error`);
                logError(nodeLogger, metadata, e);
                throw e;
            }
        }
    }
}
//# sourceMappingURL=Engine.js.map