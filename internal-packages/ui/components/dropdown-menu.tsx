"use client";

import clsx from "clsx/lite";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import type React from "react";
import { PopoverContent } from "./popover";

interface MenuItem {
	value: string | number;
	label: string;
	icon?: React.ReactNode;
	destructive?: boolean;
	disabled?: boolean;
	action?: () => void;
}

interface MenuGroup<T extends MenuItem> {
	groupId: string | number;
	groupLabel: string;
	items: Array<T>;
}

type MenuContent = MenuItem | MenuGroup<MenuItem>;

interface DropdownMenuItemProps {
	onMouseEnter: React.MouseEventHandler<HTMLButtonElement>;
	onMouseLeave: React.MouseEventHandler<HTMLButtonElement>;
}
interface DropdownMenuProps<
	T extends Array<MenuContent>,
	TRenderItemAsChild extends boolean,
> {
	items: T;
	trigger: React.ReactNode;
	renderItemAsChild?: TRenderItemAsChild;
	renderItem?: T[number] extends MenuGroup<infer I>
		? (
				item: I,
				props: DropdownMenuItemProps,
			) => TRenderItemAsChild extends true
				? React.ReactElement
				: React.ReactNode
		: (
				item: T[number],
				props: DropdownMenuItemProps,
			) => TRenderItemAsChild extends true
				? React.ReactElement
				: React.ReactNode;
	onSelect?: T[number] extends MenuGroup<infer I>
		? (event: Event, option: I) => void
		: (event: Event, option: T[number]) => void;
	onItemHover?: T[number] extends MenuGroup<infer I>
		? (item: I, isHovered: boolean) => void
		: (item: T[number], isHovered: boolean) => void;
	widthClassName?: string;
	sideOffset?: DropdownMenuPrimitive.DropdownMenuContentProps["sideOffset"];
	alignOffset?: DropdownMenuPrimitive.DropdownMenuContentProps["alignOffset"];
	align?: DropdownMenuPrimitive.DropdownMenuContentProps["align"];
	open?: DropdownMenuPrimitive.DropdownMenuProps["open"];
	onOpenChange?: DropdownMenuPrimitive.DropdownMenuProps["onOpenChange"];
}

function isGroupItem<T extends MenuItem>(
	option: T | MenuGroup<T>,
): option is MenuGroup<T> {
	return (
		"groupLabel" in option && Array.isArray((option as MenuGroup<T>).items)
	);
}

export function DropdownMenu<
	T extends Array<MenuContent>,
	TRenderItemAsChild extends boolean = false,
>({
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
}: DropdownMenuProps<T, TRenderItemAsChild>) {
	const renderMenuItem = (item: MenuItem) => (
		<DropdownMenuPrimitive.Item
			asChild={renderItemAsChild}
			key={item.value}
			onSelect={(event) => onSelect?.(event, item)}
			onMouseEnter={() => onItemHover?.(item, true)}
			onMouseLeave={() => onItemHover?.(item, false)}
			disabled={item.disabled}
			className={
				renderItemAsChild
					? ""
					: clsx(
							"text-text outline-none cursor-pointer",
							item.destructive
								? "hover:bg-destructive-hover-bg"
								: "hover:bg-ghost-element-hover",
							"rounded-[4px] px-[8px] py-[6px] text-[14px]",
							"flex items-center justify-between gap-[4px]",
							item.disabled && "opacity-50 cursor-not-allowed",
						)
			}
		>
			{renderItem ? (
				renderItem(item, {
					onMouseEnter: () => onItemHover?.(item, true),
					onMouseLeave: () => onItemHover?.(item, false),
				})
			) : item.icon ? (
				<div className="flex items-center gap-2">
					<span className="h-4 w-4">{item.icon}</span>
					{item.label}
				</div>
			) : (
				item.label
			)}
		</DropdownMenuPrimitive.Item>
	);

	return (
		<DropdownMenuPrimitive.Root open={open} onOpenChange={onOpenChange}>
			<DropdownMenuPrimitive.Trigger asChild>
				{trigger}
			</DropdownMenuPrimitive.Trigger>
			<DropdownMenuPrimitive.Portal>
				<DropdownMenuPrimitive.Content
					sideOffset={sideOffset}
					align={align}
					className={clsx("z-10 overflow-hidden flex flex-col", widthClassName)}
					style={{ maxHeight: "85vh" }}
				>
					<PopoverContent>
						{items.map((option) => {
							if (isGroupItem(option)) {
								return (
									<DropdownMenuPrimitive.Group key={option.groupId}>
										<DropdownMenuPrimitive.Label className="text-text px-[8px] py-[6px] text-[12px] font-medium">
											{option.groupLabel}
										</DropdownMenuPrimitive.Label>
										{option.items.map(renderMenuItem)}
									</DropdownMenuPrimitive.Group>
								);
							}
							return renderMenuItem(option);
						})}
					</PopoverContent>
				</DropdownMenuPrimitive.Content>
			</DropdownMenuPrimitive.Portal>
		</DropdownMenuPrimitive.Root>
	);
}
