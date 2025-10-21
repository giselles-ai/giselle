import type React from "react";
interface NoteProps {
	children: React.ReactNode;
	type?: "error" | "warning" | "success" | "info";
	action?: React.ReactNode;
}
export declare function Note({
	children,
	type,
	action,
}: NoteProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=note.d.ts.map
