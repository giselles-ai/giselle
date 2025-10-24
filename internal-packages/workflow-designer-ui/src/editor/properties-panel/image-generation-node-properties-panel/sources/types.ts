import type {
	Connection,
	Node,
	NodeBase,
	Output,
} from "@giselle-sdk/data-type";

interface UnconnectedSource<T extends NodeBase = Node> {
	output: Output;
	node: T;
	connection?: never;
}
export interface ConnectedSource<T extends NodeBase = Node> {
	output: Output;
	node: T;
	connection: Connection;
}
export type { UnconnectedSource as Source };
