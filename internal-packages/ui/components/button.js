import clsx from "clsx/lite";
import { Slot } from "radix-ui";
import {
	Fragment as _Fragment,
	jsx as _jsx,
	jsxs as _jsxs,
} from "react/jsx-runtime";
export function Button({
	className,
	children,
	leftIcon,
	rightIcon,
	variant: style = "subtle",
	size = "default",
	asChild = false,
	...props
}) {
	const Comp = asChild ? Slot.Root : "button";
	return _jsxs(Comp, {
		className: clsx(
			"relative flex items-center justify-center outline-none overflow-hidden",
			"focus-visible:ring-2 focus-visible:ring-primary-700/60 focus-visible:ring-offset-1",
			"data-[size=default]:px-[8px] data-[size=default]:py-[2px] data-[size=default]:rounded-[2px] data-[size=default]:gap-[4px]",
			"data-[size=large]:px-6 data-[size=large]:h-[38px] data-[size=large]:rounded-lg data-[size=large]:gap-[6px]",
			"data-[size=compact]:px-[4px] data-[size=compact]:py-[0px] data-[size=compact]:rounded-[2px] data-[size=compact]:gap-[2px]",
			"data-[style=subtle]:hover:bg-ghost-element-hover",
			"data-[style=filled]:bg-background data-[style=filled]:border data-[style=filled]:border-border data-[style=filled]:hover:bg-ghost-element-hover",
			"data-[style=solid]:bg-(image:--solid-button-bg) data-[style=solid]:text-inverse data-[style=solid]:border data-[style=solid]:border-button-solid-border data-[style=solid]:shadow-(--solid-button-shadow) data-[style=solid]:hover:bg-primary-800",
			"data-[style=glass]:shadow-glass data-[style=glass]:backdrop-blur-md data-[style=glass]:rounded-lg data-[style=glass]:px-4 data-[style=glass]:py-2",
			"data-[style=glass]:after:absolute data-[style=glass]:after:bg-linear-to-r data-[style=glass]:after:from-transparent data-[style=glass]:after:via-glass-highlight/60 data-[style=glass]:after:left-4 data-[style=glass]:after:right-4 data-[style=glass]:after:h-px data-[style=glass]:after:top-0",
			"data-[style=glass]:border data-[style=glass]:border-glass-border/20",
			"data-[style=outline]:border data-[style=outline]:border-t-border/60 data-[style=outline]:border-x-border/40 data-[style=outline]:border-b-black/60",
			"data-[style=link]:p-0 data-[style=link]:h-auto data-[style=link]:hover:underline",
			"data-[style=primary]:text-white/80 data-[style=primary]:bg-gradient-to-b data-[style=primary]:from-[#202530] data-[style=primary]:to-[#12151f]",
			"data-[style=primary]:border data-[style=primary]:border-black/70",
			"data-[style=primary]:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_2px_8px_rgba(5,10,20,0.4),0_1px_2px_rgba(0,0,0,0.3)]",
			"data-[style=primary]:transition-all data-[style=primary]:duration-200 data-[style=primary]:active:scale-[0.98]",
			"cursor-pointer transition-colors",
			className,
		),
		"data-style": style,
		"data-size": size,
		...props,
		children: [
			style === "glass" &&
				_jsxs(_Fragment, {
					children: [
						_jsx("div", {
							className: "absolute inset-0 bg-(image:--glass-button-bg)",
						}),
						_jsx("div", {
							className:
								"absolute inset-0 bg-(image:--glass-button-bg-hover) opacity-0 hover:opacity-100 transition-opacity",
						}),
					],
				}),
			leftIcon &&
				_jsx("div", {
					className: "*:size-[13px] *:text-text",
					children: leftIcon,
				}),
			_jsx(Slot.Slottable, {
				children: _jsx("div", {
					className: "text-[13px] text-text",
					children: children,
				}),
			}),
			rightIcon &&
				_jsx("div", { className: "*:size-[13px]", children: rightIcon }),
		],
	});
}
//# sourceMappingURL=button.js.map
