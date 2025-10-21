import clsx from "clsx/lite";
import { Popover as PopoverPrimitive } from "radix-ui";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { GlassSurfaceLayers } from "./glass-surface";
export function PopoverContent(props) {
	return _jsxs("div", {
		className: clsx("relative rounded-[8px] p-[4px] shadow-xl"),
		...props,
		children: [
			_jsx(GlassSurfaceLayers, {
				radiusClass: "rounded-[8px]",
				borderStyle: "solid",
				withTopHighlight: true,
				withBaseFill: true,
			}),
			props.children,
		],
	});
}
export function Popover({ trigger, children }) {
	return _jsxs(PopoverPrimitive.Root, {
		children: [
			_jsx(PopoverPrimitive.Trigger, { asChild: true, children: trigger }),
			_jsx(PopoverPrimitive.Portal, {
				children: _jsx(PopoverPrimitive.Content, {
					asChild: true,
					children: _jsx(PopoverContent, { children: children }),
				}),
			}),
		],
	});
}
//# sourceMappingURL=popover.js.map
