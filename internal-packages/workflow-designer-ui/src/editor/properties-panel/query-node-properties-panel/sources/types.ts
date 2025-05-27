import type {
	Connection,
	NodeBase,
	NodeLike,
	Output,
	VectorStoreNode,
} from "@giselle-sdk/data-type";

export interface UnconnectedSource<T extends NodeBase = NodeLike> {
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

// If we implement another datasource, we should add a new type here.
// export type DataStore = VectorStoreNode | DocumentStoreNode;
export type DatastoreNode = VectorStoreNode;
