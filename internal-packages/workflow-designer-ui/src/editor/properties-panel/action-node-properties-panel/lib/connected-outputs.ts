import type {
	ConnectionId,
	Input,
	NodeLike,
	Output,
} from "@giselle-sdk/data-type";

export type InputWithConnectedOutput = Input & {
	connectedOutput?: Output & { node: NodeLike } & {
		connectionId: ConnectionId;
	};
};
