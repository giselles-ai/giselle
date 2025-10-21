import clsx from "clsx/lite";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import {
	Fragment as _Fragment,
	jsx as _jsx,
	jsxs as _jsxs,
} from "react/jsx-runtime";
import { Popover, PopoverContent } from "./popover";
export function RoleMenu({
	value,
	options,
	onChange,
	canEdit = false,
	canRemove = false,
	onRemove,
	className,
	widthClassName,
	triggerClassName,
}) {
	var _a, _b;
	return _jsx(Popover, {
		trigger: _jsxs("button", {
			type: "button",
			className: clsx(
				"w-full flex justify-between items-center rounded-[8px] h-8 px-[12px] text-left text-[14px]",
				"outline-none focus:outline-none focus-visible:outline-none focus:ring-0",
				"bg-inverse/5 transition-colors hover:bg-inverse/10",
				widthClassName,
				triggerClassName,
			),
			children: [
				_jsx("div", {
					className:
						"flex-1 min-w-0 text-ellipsis overflow-hidden whitespace-nowrap capitalize",
					children:
						(_b =
							(_a = options.find((o) => o.value === value)) === null ||
							_a === void 0
								? void 0
								: _a.label) !== null && _b !== void 0
							? _b
							: value,
				}),
				_jsx(ChevronDownIcon, {
					className: "size-[13px] shrink-0 text-text ml-2",
				}),
			],
		}),
		children: _jsx(PopoverContent, {
			children: _jsxs("div", {
				className: clsx("min-w-[165px] p-1", className),
				children: [
					options.map((opt) =>
						_jsxs(
							"button",
							{
								type: "button",
								disabled: !canEdit,
								onClick: () =>
									canEdit &&
									(onChange === null || onChange === void 0
										? void 0
										: onChange(opt.value)),
								className: clsx(
									"text-text outline-none cursor-pointer hover:bg-ghost-element-hover",
									"rounded-[4px] px-[8px] py-[6px] text-[14px] w-full text-left capitalize",
									!canEdit &&
										"opacity-50 cursor-not-allowed pointer-events-none",
									"flex items-center gap-2",
								),
								children: [
									_jsx("span", {
										className:
											"inline-flex justify-center items-center w-4 h-4 mr-2",
										children:
											value === opt.value &&
											_jsx(CheckIcon, { className: "size-[13px]" }),
									}),
									opt.label,
								],
							},
							opt.value,
						),
					),
					canRemove &&
						_jsxs(_Fragment, {
							children: [
								_jsx("div", { className: "my-2 h-px bg-inverse/10" }),
								_jsx("button", {
									type: "button",
									onClick: onRemove,
									className: clsx(
										"w-full text-left rounded-md px-3 py-2 font-medium text-[14px]",
										"text-error-900 hover:bg-error-900/20",
									),
									children: "Remove",
								}),
							],
						}),
				],
			}),
		}),
	});
}
//# sourceMappingURL=role-menu.js.map
