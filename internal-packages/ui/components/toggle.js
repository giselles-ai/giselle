import clsx from "clsx/lite";
import { Switch } from "radix-ui";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Toggle({ name, checked, onCheckedChange, disabled, children }) {
	return _jsxs("div", {
		className: "flex items-center",
		children: [
			children,
			_jsx(Switch.Root, {
				className: clsx(
					"h-[15px] w-[27px] rounded-full outline-none",
					"border border-border-muted data-[state=checked]:border-primary-900",
					"bg-transparent data-[state=checked]:bg-primary-900",
					disabled && "opacity-50 cursor-not-allowed",
				),
				id: name,
				checked: checked,
				onCheckedChange: onCheckedChange,
				disabled: disabled,
				children: _jsx(Switch.Thumb, {
					className: clsx(
						"block size-[11px] translate-x-[2px] rounded-full",
						"bg-inverse data-[state=checked]:bg-inverse",
						"transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-[13px]",
					),
				}),
			}),
		],
	});
}
//# sourceMappingURL=toggle.js.map
