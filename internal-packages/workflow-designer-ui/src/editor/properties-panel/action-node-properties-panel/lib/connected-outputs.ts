import type {
	ConnectionId,
	Input,
	NodeLike,
	Output,
} from "@giselles-ai/protocol";

export type InputWithConnectedOutput = Input & {
	connectedOutput?: Output & { node: NodeLike } & {
		connectionId: ConnectionId;
	};
};
