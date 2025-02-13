import { createId } from "@paralleldrive/cuid2";
import type { JSX } from "react";
import invariant from "tiny-invariant";
import { type InferInput, type ObjectSchema, parse } from "valibot";
import type { RequestId } from "../requests/types";
import {
	type DefaultPort,
	type DefaultPorts,
	type NodeClasses,
	type NodeGraph,
	portDirection,
} from "./types";

type InferSchema<T> = T extends { dataSchema?: infer U }
	? U extends undefined
		? unknown
		: U extends ObjectSchema<infer E, infer M>
			? ObjectSchema<E, M>
			: unknown
	: unknown;

type CreateNodeData<TData> = TData extends ObjectSchema<infer E, infer M>
	? { data: InferInput<ObjectSchema<E, M>> }
	: { data?: never };
type CreateNodeArgs<TData> = DefaultPorts<
	DefaultPort[],
	DefaultPort[]
> & {} & CreateNodeData<TData>;

type NodeService<TNodeClasses extends NodeClasses> = {
	createNode: <ClassName extends keyof TNodeClasses>(
		name: ClassName,
		args?: CreateNodeArgs<InferSchema<TNodeClasses[ClassName]>>,
	) => NodeGraph;
	renderPanel: <ClassName extends keyof TNodeClasses>(
		name: ClassName,
		{ node }: { node: NodeGraph },
	) => JSX.Element | null;
	$inferClassNames: keyof TNodeClasses;
	runAction: <ClassName extends keyof TNodeClasses>(
		className: ClassName,
		args: {
			node: NodeGraph;
			requestId: RequestId;
			requestDbId: number;
			nodeDbId: number;
		},
	) => Promise<void>;
	runResolver: <ClassName extends keyof TNodeClasses>(
		className: ClassName,
		args: {
			node: NodeGraph;
			requestId: RequestId;
			requestDbId: number;
			nodeDbId: number;
		},
	) => Promise<void>;
	runAfterCreateCallback: <ClassName extends keyof TNodeClasses>(
		className: ClassName,
		args: { nodeGraph: NodeGraph; nodeDbId: number },
	) => Promise<void>;
};

export function createNodeService<TNodeClasses extends NodeClasses>(
	nodeClasses: TNodeClasses,
): NodeService<TNodeClasses> {
	return {
		createNode: (name, args) => {
			invariant(typeof name === "string", "name must be a string");
			const nodeClass = nodeClasses[name];
			const targetPorts = [
				...(nodeClass.defaultPorts.inputPorts ?? []),
				...(args?.inputPorts ?? []),
			] as DefaultPort[];
			const sourcePorts = [
				...(nodeClass.defaultPorts.outputPorts ?? []),
				...(args?.outputPorts ?? []),
			] as DefaultPort[];
			const id = `nd_${createId()}` as const;

			return {
				id,
				className: name,
				name,
				data: args?.data ?? {},
				ports: [
					...targetPorts.map(({ type, name }) => ({
						id: `pt_${createId()}` as const,
						nodeId: id,
						direction: "target" as const,
						type,
						name,
					})),
					...sourcePorts.map(({ type, name }) => ({
						id: `pt_${createId()}` as const,
						nodeId: id,
						direction: "source" as const,
						type,
						name,
					})),
				],
			};
		},
		renderPanel: (name, { node }) => {
			const nodeClass = nodeClasses[name];
			const renderPanel = nodeClass.renderPanel;
			if (renderPanel == null) {
				return null;
			}
			const dataSchema = nodeClass.dataSchema;
			const data = dataSchema == null ? {} : parse(dataSchema, node.data);
			return renderPanel({ node, data });
		},
		runAction: async (name, { node, requestId, requestDbId, nodeDbId }) => {
			const nodeClass = nodeClasses[name];
			const action = nodeClass.action;
			if (action == null) {
				return;
			}
			const dataSchema = nodeClass.dataSchema;
			const data = dataSchema == null ? {} : parse(dataSchema, node.data);
			await action({
				requestDbId,
				requestId,
				nodeGraph: node,
				nodeDbId,
				data,
				findDefaultTargetPort: (name) => {
					const port = node.ports.find(
						({ name: portName, direction }) =>
							direction === portDirection.target && portName === name,
					);
					invariant(port != null, `Port not found: ${name}`);
					return port;
				},
				findDefaultSourceport: (name) => {
					const port = node.ports.find(
						({ name: portName, direction }) =>
							direction === portDirection.source && portName === name,
					);
					invariant(port != null, `Port not found: ${name}`);
					return port;
				},
			});
		},
		runResolver: async (name, { node, requestId, requestDbId, nodeDbId }) => {
			const nodeClass = nodeClasses[name];
			const resolver = nodeClass.resolver;
			if (resolver == null) {
				console.log("Resolver not found");
				return;
			}
			const dataSchema = nodeClass.dataSchema;
			const data = dataSchema == null ? {} : parse(dataSchema, node.data);
			await resolver({
				requestId,
				requestDbId,
				nodeGraph: node,
				nodeDbId,
				// knowledges,
				data,
				findDefaultTargetPort: (name) => {
					const port = node.ports.find(
						({ name: portName, direction }) =>
							direction === portDirection.target && portName === name,
					);
					invariant(port != null, `Port not found: ${name}`);
					return port;
				},
				findDefaultSourceport: (name) => {
					const port = node.ports.find(
						({ name: portName, direction }) =>
							direction === portDirection.source && portName === name,
					);
					invariant(port != null, `Port not found: ${name}`);
					return port;
				},
			});
		},
		runAfterCreateCallback: async (name, { nodeDbId, nodeGraph }) => {
			const nodeClass = nodeClasses[name];
			const afterCreate = nodeClass.afterCreate;
			if (afterCreate == null) {
				console.log("After create not found");
				return;
			}
			const dataSchema = nodeClass.dataSchema;
			const data = dataSchema == null ? {} : parse(dataSchema, nodeGraph.data);
			await afterCreate({ nodeGraph, data, nodeDbId });
		},
		$inferClassNames: "" as keyof TNodeClasses,
	};
}
