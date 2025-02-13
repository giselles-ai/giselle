import type { JSX } from "react";
import type { BaseSchema, InferInput, ObjectSchema } from "valibot";
import type { RequestId } from "../requests/types";

// biome-ignore lint: lint/suspicious/noExplicitAny
export type Node<TClassName extends string = string, TData = any> = {
	id: `nd_${string}`;
	className: TClassName;
	name: string;
	data: TData;
};

export const portType = {
	execution: "execution",
	data: "data",
} as const;
export type PortType = (typeof portType)[keyof typeof portType];
export const portDirection = {
	source: "source",
	target: "target",
} as const;
export type PortDirection = (typeof portDirection)[keyof typeof portDirection];
export type Port<TName extends string = string> = {
	id: `pt_${string}`;
	nodeId: Node["id"];
	type: PortType;
	name: TName;
	direction: PortDirection;
};

// biome-ignore lint: lint/suspicious/noExplicitAny
export type NodeGraph<TClassName extends string = string, TData = any> = Node<
	TClassName,
	TData
> & {
	ports: Port[];
};

export type DefaultPort<TName extends string = string> = Omit<
	Port<TName>,
	"id" | "nodeId" | "direction"
>;
export type DefaultPorts<
	TInputPorts extends DefaultPort<string>[],
	TOutputPorts extends DefaultPort<string>[],
> = {
	inputPorts?: TInputPorts;
	outputPorts?: TOutputPorts;
};

export const nodeClassCategory = {
	trigger: "trigger",
	llm: "llm",
	response: "response",
	utility: "utility",
};
export type NodeClassCategory =
	(typeof nodeClassCategory)[keyof typeof nodeClassCategory];

type ResolverArgs<TBaseSchema, TDefaultPorts> = {
	requestDbId: number;
	requestId: RequestId;
	nodeDbId: number;
	nodeGraph: NodeGraph;
	// knowledges: Knowledge[];
	data: TBaseSchema extends ObjectSchema<infer E, infer M>
		? InferInput<ObjectSchema<E, M>>
		: never;
	findDefaultTargetPort: (
		// biome-ignore lint: lint/suspicious/noExplicitAny
		name: TDefaultPorts extends DefaultPorts<infer TargetPorts, any>
			? TargetPorts[number]["name"]
			: never,
	) => Port;
	findDefaultSourceport: (
		// biome-ignore lint: lint/suspicious/noExplicitAny
		name: TDefaultPorts extends DefaultPorts<any, infer SourcePorts>
			? SourcePorts[number]["name"]
			: never,
	) => Port;
};
type Resolver<TBaseSchema, TDefaultPorts> = (
	args: ResolverArgs<TBaseSchema, TDefaultPorts>,
) => Promise<void>;

type ActionArgs<TBaseSchema, TDefaultPorts> = ResolverArgs<
	TBaseSchema,
	TDefaultPorts
>;
type Action<TBaseSchema, TDefaultPorts> = (
	args: ActionArgs<TBaseSchema, TDefaultPorts>,
) => Promise<void>;

type RenderPanelArgs<TBaseSchema> = {
	node: NodeGraph;
	data: TBaseSchema extends ObjectSchema<infer E, infer M>
		? InferInput<ObjectSchema<E, M>>
		: never;
};
type RenderPanel<TBaseSchema> = (
	args: RenderPanelArgs<TBaseSchema>,
) => JSX.Element;

type AfterCreateCallbackArgs<TBaseSchema> = {
	nodeGraph: NodeGraph;
	nodeDbId: number;
	data: TBaseSchema extends ObjectSchema<infer E, infer M>
		? InferInput<ObjectSchema<E, M>>
		: never;
};
type AfterCreateCallback<TBaseSchema> = (
	args: AfterCreateCallbackArgs<TBaseSchema>,
) => Promise<void>;

export type NodeClassOptions<
	TNodeClassCategories extends NodeClassCategory[],
	// biome-ignore lint: lint/suspicious/noExplicitAny
	TDefaultPorts extends DefaultPorts<any, any>,
	// biome-ignore lint: lint/suspicious/noExplicitAny
	TBaseSchema extends BaseSchema<any, any, any> = any,
> = {
	categories: TNodeClassCategories;
	defaultPorts: TDefaultPorts;
	dataSchema?: TBaseSchema;
	renderPanel?: RenderPanel<TBaseSchema>;
	action?: Action<TBaseSchema, TDefaultPorts>;
	resolver?: Resolver<TBaseSchema, TDefaultPorts>;
	afterCreate?: AfterCreateCallback<TBaseSchema>;
};

export type NodeClass<
	TNodeName extends string,
	TNodeClassCategories extends NodeClassCategory[],
	// biome-ignore lint: lint/suspicious/noExplicitAny
	TDefaultPorts extends DefaultPorts<any, any>,
	// biome-ignore lint: lint/suspicious/noExplicitAny
	TBaseSchema extends BaseSchema<any, any, any> = any,
> = {
	name: TNodeName;
	categories: TNodeClassCategories;
	defaultPorts: TDefaultPorts;
	dataSchema?: TBaseSchema;
	renderPanel?: RenderPanel<TBaseSchema>;
	action?: Action<TBaseSchema, TDefaultPorts>;
	resolver?: Resolver<TBaseSchema, TDefaultPorts>;
	afterCreate?: AfterCreateCallback<TBaseSchema>;
};

// biome-ignore lint: lint/suspicious/noExplicitAny
export type NodeClasses = Record<string, NodeClass<any, any, any, any>>;
