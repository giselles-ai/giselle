import clsx from "clsx/lite";
import { AlertCircle } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Note({ children, type = "error", action }) {
	return _jsxs("div", {
		className: clsx(
			"group flex items-center border px-[8px] py-[2px] rounded-[2px] border-border",
		),
		"data-type": type,
		children: [
			_jsxs("div", {
				className: "flex items-center gap-[4px]",
				children: [
					_jsx(AlertCircle, {
						className:
							"size-[13px] flex-shrink-0 group-data-[type=error]:text-error",
					}),
					_jsx("div", { className: "flex-1 text-[13px]", children: children }),
				],
			}),
			action && _jsx("div", { className: "flex-shrink-0", children: action }),
		],
	});
}
//# sourceMappingURL=note.js.map
