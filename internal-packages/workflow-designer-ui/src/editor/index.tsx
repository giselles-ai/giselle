"use client";

import "@xyflow/react/dist/style.css";
import { V2Placeholder } from "./v2";

export function Editor({
	isReadOnly = false,
	userRole = "viewer",
	onFlowNameChange,
}: {
	isReadOnly?: boolean;
	userRole?: "viewer" | "guest" | "editor" | "owner";
	onFlowNameChange?: (name: string) => Promise<void>;
}) {
	return (
		<V2Placeholder
			isReadOnly={isReadOnly}
			userRole={userRole}
			onNameChange={onFlowNameChange}
		/>
	);
}
