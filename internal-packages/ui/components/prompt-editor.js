import { TextEditor } from "@giselle-sdk/text-editor/react";
import clsx from "clsx/lite";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function PromptEditor({
	value,
	onValueChange,
	nodes,
	connectedSources,
	placeholder,
	header,
	footer,
	showToolbar = false,
	variant = "plain",
	containerClassName,
	editorClassName,
}) {
	const variantClass =
		variant === "glass"
			? "rounded-[8px] p-[8px] bg-transparent"
			: variant === "solid"
				? "rounded-[8px] p-[8px] bg-bg/10"
				: variant === "compact"
					? "rounded-[6px] p-[6px]"
					: "";
	return _jsxs("div", {
		className: clsx(
			"flex flex-col w-full h-full min-h-0",
			variantClass,
			containerClassName,
		),
		children: [
			_jsx(TextEditor, {
				value: value,
				onValueChange: onValueChange,
				nodes: nodes,
				connectedSources: connectedSources,
				placeholder: placeholder,
				header: header,
				showToolbar: showToolbar,
				editorClassName:
					"bg-inverse/10 border-none !pt-[4px] !pr-[8px] !pb-[4px] !pl-[12px] rounded-[8px] min-h-[120px]",
			}),
			footer
				? _jsx("div", {
						className: clsx("mt-2", editorClassName),
						children: footer,
					})
				: null,
		],
	});
}
//# sourceMappingURL=prompt-editor.js.map
