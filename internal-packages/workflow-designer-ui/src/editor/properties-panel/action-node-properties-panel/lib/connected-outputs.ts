import type {
	ConnectionId,
	Input,
	NodeLike,
	Output,
} from "@giselle-ai/protocol";

export type InputWithConnectedOutput = Input & {
	connectedOutput?: Output & { node: NodeLike } & {
		connectionId: ConnectionId;
	};
};
