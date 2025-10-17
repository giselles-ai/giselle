import { Ellipsis } from "lucide-react";
import { Select, type SelectOption } from "./select";

export type RepoAction = SelectOption & {
	onSelect?: () => void;
	destructive?: boolean;
};

export function RepoActionMenu({
	actions,
	id,
	disabled,
}: {
	actions: RepoAction[];
	id?: string;
	disabled?: boolean;
}) {
	return (
		<Select
			id={id}
			placeholder="Actions"
			options={actions}
			widthClassName="w-6 h-6"
			triggerClassName="p-0 h-6 w-6 rounded-md mr-1"
			disabled={disabled}
			renderTriggerContent={<Ellipsis className="text-inverse/70" />}
			hideChevron
			contentMinWidthClassName="min-w-[165px]"
			disableHoverBg
			itemClassNameForOption={(opt) =>
				(opt as RepoAction).destructive
					? "px-4 py-3 font-medium text-[14px] text-error-900 hover:!bg-error-900/20 rounded-md"
					: "px-4 py-3 font-medium text-[14px] text-text hover:bg-white/5 rounded-md"
			}
			onValueChange={(v) => {
				const action = actions.find((a) => `${a.value}` === v) as
					| RepoAction
					| undefined;
				if (action?.onSelect) action.onSelect();
			}}
		/>
	);
}
