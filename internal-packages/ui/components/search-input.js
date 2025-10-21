import clsx from "clsx/lite";
import { Search } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function SearchInput({ className, iconClassName, ...props }) {
	return _jsxs("div", {
		className: "relative w-full",
		children: [
			_jsx(Search, {
				className: clsx(
					"absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text/60",
					iconClassName,
				),
			}),
			_jsx("input", {
				className: clsx(
					// base sizing and layout
					"pl-12 pr-4 h-10 w-full rounded-[8px]",
					// colors (inverse-ready via semantic tokens)
					"bg-bg text-text border border-border",
					// placeholder color stays as-is to preserve current opacity balance
					"placeholder:text-link-muted",
					// interaction states
					"shadow-none transition-colors",
					"hover:bg-surface/10",
					"focus:border-transparent focus:ring-1 focus:ring-focused/40 focus:ring-inset focus:ring-offset-0",
					className,
				),
				...props,
			}),
		],
	});
}
//# sourceMappingURL=search-input.js.map
