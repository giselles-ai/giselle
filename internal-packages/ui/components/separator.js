import clsx from "clsx/lite";
import { jsx as _jsx } from "react/jsx-runtime";
export function Separator({
	className,
	variant = "default",
	orientation = "horizontal",
	...props
}) {
	const isVertical = orientation === "vertical";
	return _jsx("div", {
		"aria-hidden": true,
		"data-variant": variant,
		"data-orientation": orientation,
		className: clsx(
			"shrink-0",
			// sizing
			isVertical ? "w-px h-full" : "h-px w-full",
			// single hairline using border only (avoid double line)
			isVertical ? "border-l border-border" : "border-t border-border",
			// allow inverse styling hook (color mapping can be updated later)
			"data-[variant=inverse]:border-border",
			className,
		),
		...props,
	});
}
//# sourceMappingURL=separator.js.map
