import clsx from "clsx/lite";
import { useId } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function FormField({
	label,
	error,
	hint,
	containerClassName,
	className,
	ref,
	...props
}) {
	const id = useId();
	const inputId = props.id || id;
	return _jsxs("div", {
		className: clsx("space-y-1", containerClassName),
		children: [
			label &&
				_jsx("label", {
					htmlFor: inputId,
					className: "text-sm text-text-muted font-geist",
					children: label,
				}),
			_jsx("input", {
				ref: ref,
				id: inputId,
				className: clsx(
					"w-full rounded-md bg-bg border border-border-muted px-3 py-2",
					"text-text placeholder:text-text/30",
					"focus:outline-none focus:ring-1 focus:ring-inverse/20",
					"disabled:opacity-50 disabled:cursor-not-allowed",
					error && "border-error-900 focus:ring-error-900/20",
					className,
				),
				...props,
			}),
			hint &&
				!error &&
				_jsx("p", { className: "text-xs text-text-muted", children: hint }),
			error &&
				_jsx("p", { className: "text-xs text-error-900", children: error }),
		],
	});
}
//# sourceMappingURL=form-field.js.map
