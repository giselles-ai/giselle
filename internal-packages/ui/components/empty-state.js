import clsx from "clsx/lite";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function EmptyState({ title, icon, description, children, className }) {
	return _jsxs("div", {
		className: clsx("flex flex-col items-center gap-[8px]", className),
		children: [
			icon,
			title && _jsx("p", { className: " text-text", children: title }),
			description &&
				_jsx("p", {
					className: "text-text-muted text-[12px] text-center leading-5",
					children: description,
				}),
			children,
		],
	});
}
//# sourceMappingURL=empty-state.js.map
