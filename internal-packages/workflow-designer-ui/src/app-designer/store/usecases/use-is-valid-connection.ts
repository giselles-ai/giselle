import type { IsValidConnection } from "@xyflow/react";
import { useCallback } from "react";
import { useAppDesignerStore } from "../hooks";

export function useIsValidConnection(): IsValidConnection {
	const connections = useAppDesignerStore((s) => s.connections);
	return useCallback<IsValidConnection>(
		(connection) => {
			if (
				!connection.sourceHandle ||
				!connection.targetHandle ||
				connection.source === connection.target
			) {
				return false;
			}
			return !connections.some(
				(conn) =>
					conn.inputNode.id === connection.target &&
					conn.outputNode.id === connection.source &&
					(conn.inputId === connection.targetHandle ||
						conn.outputId === connection.sourceHandle),
			);
		},
		[connections],
	);
}
