import clsx from "clsx/lite";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PopoverContent } from "./popover";
export function Select({
	renderOption,
	options,
	placeholder,
	value,
	onValueChange,
	defaultValue,
	widthClassName,
	triggerClassName,
	name,
	id,
	renderValue,
	itemClassNameForOption,
	disabled,
	renderTriggerContent,
	hideChevron,
	ariaLabel,
	contentMinWidthClassName,
	disableHoverBg,
}) {
	return _jsxs(SelectPrimitive.Root, {
		value: value,
		onValueChange: onValueChange,
		defaultValue: defaultValue,
		name: name,
		children: [
			_jsx(SelectPrimitive.Trigger, {
				id: id,
				asChild: true,
				children: _jsxs("button", {
					type: "button",
					className: clsx(
						// width: default full, but allow override via widthClassName
						widthClassName !== null && widthClassName !== void 0
							? widthClassName
							: "w-full",
						"flex justify-between items-center rounded-[8px] h-10 px-[12px] text-left text-[14px] shrink-0",
						"outline-none focus:outline-none focus-visible:outline-none focus:ring-0",
						renderTriggerContent
							? clsx(
									"bg-transparent transition-colors",
									disableHoverBg ? undefined : "hover:bg-white/5",
								)
							: "bg-inverse/5 transition-colors hover:bg-inverse/10",
						"disabled:opacity-50 disabled:cursor-not-allowed",
						"data-[placeholder]:text-text-muted",
						triggerClassName,
					),
					disabled: disabled,
					"aria-label": ariaLabel,
					children: [
						renderTriggerContent
							? _jsx("div", {
									className: "flex-1 flex items-center justify-center",
									children: renderTriggerContent,
								})
							: _jsx("div", {
									className:
										"flex-1 min-w-0 text-ellipsis overflow-hidden whitespace-nowrap",
									children: _jsx(SelectPrimitive.Value, {
										placeholder: placeholder,
									}),
								}),
						!hideChevron &&
							_jsx(ChevronDownIcon, {
								className: "size-[13px] shrink-0 text-text ml-2",
							}),
					],
				}),
			}),
			_jsx(SelectPrimitive.Portal, {
				children: _jsx(SelectPrimitive.Content, {
					position: "popper",
					sideOffset: 4,
					className: clsx(
						contentMinWidthClassName !== null &&
							contentMinWidthClassName !== void 0
							? contentMinWidthClassName
							: "min-w-(--radix-select-trigger-width)",
						"z-50",
					),
					children: _jsx(PopoverContent, {
						children: _jsx(SelectPrimitive.Viewport, {
							children: options.map((option) =>
								_jsxs(
									SelectPrimitive.Item,
									{
										value: renderValue
											? `${renderValue(option)}`
											: `${option.value}`,
										disabled: option.disabled,
										className: clsx(
											"outline-none cursor-pointer hover:bg-white/5",
											"rounded-[4px] px-[8px] py-[6px] text-[14px]",
											"flex items-center justify-between gap-[4px]",
											"data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed data-[disabled]:pointer-events-none",
											itemClassNameForOption === null ||
												itemClassNameForOption === void 0
												? void 0
												: itemClassNameForOption(option),
										),
										children: [
											_jsx(SelectPrimitive.ItemText, {
												children: option.icon
													? _jsxs("div", {
															className: "flex items-center gap-2",
															children: [
																_jsx("span", {
																	className: "h-4 w-4",
																	children: option.icon,
																}),
																renderOption
																	? renderOption(option)
																	: option.label,
															],
														})
													: renderOption
														? renderOption(option)
														: option.label,
											}),
											_jsx(SelectPrimitive.ItemIndicator, {
												children: _jsx(CheckIcon, { className: "size-[13px]" }),
											}),
										],
									},
									option.value,
								),
							),
						}),
					}),
				}),
			}),
		],
	});
}
//# sourceMappingURL=select.js.map
