import type {
	Connection,
	InputId,
	NodeLike,
	OutputId,
} from "@giselle-sdk/data-type";
import { ConnectionId } from "@giselle-sdk/data-type";
import { useCallback } from "react";
import type { WorkspaceAction } from "./use-workspace-reducer";

export function useAddConnection(dispatch: React.Dispatch<WorkspaceAction>) {
	return useCallback(
		({
			outputNode,
			outputId,
			inputNode,
			inputId,
		}: {
			outputNode: NodeLike;
			outputId: OutputId;
			inputNode: NodeLike;
			inputId: InputId;
		}) => {
			dispatch({
				type: "ADD_CONNECTION",
				connection: {
					id: ConnectionId.generate(),
					outputNode: {
						id: outputNode.id,
						type: outputNode.type,
						content: { type: outputNode.content.type },
					},
					outputId,
					inputNode: {
						id: inputNode.id,
						type: inputNode.type,
						content: { type: inputNode.content.type },
					},
					inputId,
				} as Connection,
			});
		},
		[dispatch],
	);
}
