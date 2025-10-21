"use client";
import clsx from "clsx/lite";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PopoverContent } from "./popover";

function isGroupItem(option) {
	return "groupLabel" in option && Array.isArray(option.items);
}
export function DropdownMenu({
	trigger,
	items,
	renderItem,
	renderItemAsChild,
	onSelect,
	onItemHover,
	widthClassName,
	sideOffset,
	align,
	open,
	onOpenChange,
}) {
	const renderMenuItem = (item) =>
		_jsx(
			DropdownMenuPrimitive.Item,
			{
				asChild: renderItemAsChild,
				onSelect: (event) =>
					onSelect === null || onSelect === void 0
						? void 0
						: onSelect(event, item),
				onMouseEnter: () =>
					onItemHover === null || onItemHover === void 0
						? void 0
						: onItemHover(item, true),
				onMouseLeave: () =>
					onItemHover === null || onItemHover === void 0
						? void 0
						: onItemHover(item, false),
				disabled: item.disabled,
				className: renderItemAsChild
					? ""
					: clsx(
							"text-text outline-none cursor-pointer",
							item.destructive
								? "hover:bg-[var(--color-destructive-hover-bg)]"
								: "hover:bg-ghost-element-hover",
							"rounded-[4px] px-[8px] py-[6px] text-[14px]",
							"flex items-center justify-between gap-[4px]",
							item.disabled && "opacity-50 cursor-not-allowed",
						),
				children: renderItem
					? renderItem(item, {
							onMouseEnter: () =>
								onItemHover === null || onItemHover === void 0
									? void 0
									: onItemHover(item, true),
							onMouseLeave: () =>
								onItemHover === null || onItemHover === void 0
									? void 0
									: onItemHover(item, false),
						})
					: item.icon
						? _jsxs("div", {
								className: "flex items-center gap-2",
								children: [
									_jsx("span", { className: "h-4 w-4", children: item.icon }),
									item.label,
								],
							})
						: item.label,
			},
			item.value,
		);
	return _jsxs(DropdownMenuPrimitive.Root, {
		open: open,
		onOpenChange: onOpenChange,
		children: [
			_jsx(DropdownMenuPrimitive.Trigger, { asChild: true, children: trigger }),
			_jsx(DropdownMenuPrimitive.Portal, {
				children: _jsx(DropdownMenuPrimitive.Content, {
					sideOffset: sideOffset,
					align: align,
					className: clsx("z-10", widthClassName),
					children: _jsx(PopoverContent, {
						children: items.map((option) => {
							if (isGroupItem(option)) {
								return _jsxs(
									DropdownMenuPrimitive.Group,
									{
										children: [
											_jsx(DropdownMenuPrimitive.Label, {
												className:
													"text-text px-[8px] py-[6px] text-[12px] font-medium",
												children: option.groupLabel,
											}),
											option.items.map(renderMenuItem),
										],
									},
									option.groupId,
								);
							}
							return renderMenuItem(option);
						}),
					}),
				}),
			}),
		],
	});
}
//# sourceMappingURL=dropdown-menu.js.map
