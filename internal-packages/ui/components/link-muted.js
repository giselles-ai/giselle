import clsx from "clsx/lite";
import { Slot } from "radix-ui";
import { jsx as _jsx } from "react/jsx-runtime";
export function LinkMuted({ className, asChild = false, ...props }) {
	const Comp = asChild ? Slot.Root : "a";
	return _jsx(Comp, {
		className: clsx(
			// muted link color with hover recovery to normal link color
			"text-link-muted hover:underline hover:text-text",
			"transition-colors",
			className,
		),
		...props,
	});
}
//# sourceMappingURL=link-muted.js.map
