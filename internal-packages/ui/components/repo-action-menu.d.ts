import { type SelectOption } from "./select";
export type RepoAction = SelectOption & {
	onSelect?: () => void;
	destructive?: boolean;
};
export declare function RepoActionMenu({
	actions,
	id,
	disabled,
}: {
	actions: RepoAction[];
	id?: string;
	disabled?: boolean;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=repo-action-menu.d.ts.map
