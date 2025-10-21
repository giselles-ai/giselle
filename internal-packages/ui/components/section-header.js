import clsx from "clsx/lite";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function SectionHeader({ title, description, action, className }) {
	return _jsxs("div", {
		className: clsx("flex justify-between items-start", className),
		children: [
			_jsxs("div", {
				className: "flex-1",
				children: [
					_jsx("h4", {
						className:
							"text-text font-medium text-[18px] leading-[21.6px] font-sans",
						children: title,
					}),
					description &&
						_jsx("p", {
							className:
								"text-text-muted text-[14px] leading-[20.4px] font-geist mt-1",
							children: description,
						}),
				],
			}),
			action && _jsx("div", { className: "ml-4", children: action }),
		],
	});
}
//# sourceMappingURL=section-header.js.map
