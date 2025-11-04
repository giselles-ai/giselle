import type {
	ConnectionId,
	Input,
	NodeLike,
	Output,
} from "@giselle-ai/data-type";

export type InputWithConnectedOutput = Input & {
	connectedOutput?: Output & { node: NodeLike } & {
		connectionId: ConnectionId;
	};
};
