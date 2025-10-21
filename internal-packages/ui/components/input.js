import clsx from "clsx/lite";
import { jsx as _jsx } from "react/jsx-runtime";
export function Input({ className, ...props }) {
	return _jsx("input", {
		className: clsx(
			"border border-border rounded-[4px] bg-editor-background outline-none px-[8px] py-[2px] text-[14px] text-text",
			"focus:border-border-focused",
			className,
		),
		...props,
	});
}
//# sourceMappingURL=input.js.map
