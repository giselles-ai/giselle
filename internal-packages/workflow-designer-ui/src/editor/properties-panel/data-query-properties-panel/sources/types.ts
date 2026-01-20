import type {
	Connection,
	DataStoreNode,
	NodeBase,
	NodeLike,
	Output,
} from "@giselles-ai/protocol";

interface UnconnectedSource<T extends NodeBase = NodeLike> {
	output: Output;
	node: T;
	connection?: never;
}
export interface ConnectedSource<T extends NodeBase = NodeLike> {
	output: Output;
	node: T;
	connection: Connection;
}
export type Source<T extends NodeBase = NodeLike> =
	| UnconnectedSource<T>
	| ConnectedSource<T>;

export type DatastoreNode = DataStoreNode;
