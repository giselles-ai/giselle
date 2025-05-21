import type {
	Connection,
	Node,
	NodeBase,
	Output,
	VectorStoreNode,
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

// If we implement another datasource, we should add a new type here.
// export type DataStore = VectorStoreNode | DocumentStoreNode;
export type DatastoreNode = VectorStoreNode;
