import clsx from "clsx/lite";
import { Slot } from "radix-ui";
import { jsx as _jsx } from "react/jsx-runtime";
export function InverseSurface({
	className,
	asChild = false,
	withBorder = true,
	...props
}) {
	const Comp = asChild ? Slot.Root : "div";
	return _jsx(Comp, {
		className: clsx(
			// thin surface background with optional border
			"bg-surface",
			withBorder && "border border-border",
			"rounded-sm",
			className,
		),
		...props,
	});
}
//# sourceMappingURL=inverse-surface.js.map
