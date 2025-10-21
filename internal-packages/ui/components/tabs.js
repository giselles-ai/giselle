import clsx from "clsx/lite";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Tabs({
	className,
	children,
	activeIndex = 0,
	underlineVariant = "default",
	...props
}) {
	return _jsxs("div", {
		role: "tablist",
		"data-underline-variant": underlineVariant,
		className: clsx("relative flex items-center gap-2", className),
		...props,
		children: [
			children,
			_jsx("div", {
				"data-active-index": activeIndex,
				className: clsx(
					"absolute bottom-0 left-0 h-px w-full",
					"border-b border-border",
					"data-[underline-variant=inverse]:border-border",
				),
			}),
		],
	});
}
//# sourceMappingURL=tabs.js.map
