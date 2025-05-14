import type { ConnectionId, Input, Node, Output } from "@giselle-sdk/data-type";

export type InputWithConnectedOutput = Input & {
	connectedOutput?: Output & { node: Node } & { connectionId: ConnectionId };
};
