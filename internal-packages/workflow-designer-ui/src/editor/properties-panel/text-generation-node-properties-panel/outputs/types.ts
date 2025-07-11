import type {
	Connection,
	NodeBase,
	NodeLike,
	Output,
} from "@giselle-sdk/data-type";

type UnconnectedOutputWithDetails<T extends NodeBase = NodeLike> = Output & {
	node: T;
	connection?: never;
};
export type ConnectedOutputWithDetails<T extends NodeBase = NodeLike> =
	Output & {
		node: T;
		connection: Connection;
	};
export type OutputWithDetails<T extends NodeBase = NodeLike> =
	| UnconnectedOutputWithDetails<T>
	| ConnectedOutputWithDetails<T>;
