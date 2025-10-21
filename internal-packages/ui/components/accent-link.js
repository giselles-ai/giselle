import clsx from "clsx/lite";
import { jsx as _jsx } from "react/jsx-runtime";
export function AccentLink({ underline = false, className, ...props }) {
	return _jsx("a", {
		...props,
		className: clsx(
			"text-link-accent hover:text-link-accent",
			underline && "hover:underline",
			"transition-colors duration-200",
			className,
		),
	});
}
//# sourceMappingURL=accent-link.js.map
