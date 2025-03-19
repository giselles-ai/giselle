import type {
	Connection,
	Node,
	NodeBase,
	Output,
} from "@giselle-sdk/data-type";

export interface UnconnectedSource<T extends NodeBase = Node> {
	output: Output;
	node: T;
	connection?: never;
}
export interface ConnectedSource<T extends NodeBase = Node> {
	output: Output;
	node: T;
	connection: Connection;
}
export type Source<T extends NodeBase = Node> =
	| UnconnectedSource<T>
	| ConnectedSource<T>;
