import {Node, type NodeInput} from './Node';

export abstract class Job extends Node {}

export type JobInput = NodeInput & {
	initUrl?: string;
};
