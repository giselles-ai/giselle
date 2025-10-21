import { Ellipsis } from "lucide-react";
import { jsx as _jsx } from "react/jsx-runtime";
import { Select } from "./select";
export function RepoActionMenu({ actions, id, disabled }) {
	return _jsx(Select, {
		id: id,
		placeholder: "Actions",
		options: actions,
		widthClassName: "w-6 h-6",
		triggerClassName: "p-0 h-6 w-6 rounded-md mr-1",
		disabled: disabled,
		renderTriggerContent: _jsx(Ellipsis, { className: "text-inverse/70" }),
		hideChevron: true,
		contentMinWidthClassName: "min-w-[165px]",
		disableHoverBg: true,
		itemClassNameForOption: (opt) =>
			opt.destructive
				? "px-4 py-3 font-medium text-[14px] text-error-900 hover:!bg-error-900/20 rounded-md"
				: "px-4 py-3 font-medium text-[14px] text-text hover:bg-white/5 rounded-md",
		onValueChange: (v) => {
			const action = actions.find((a) => `${a.value}` === v);
			if (action === null || action === void 0 ? void 0 : action.onSelect)
				action.onSelect();
		},
	});
}
//# sourceMappingURL=repo-action-menu.js.map
