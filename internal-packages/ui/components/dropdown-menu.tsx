"use client";

import clsx from "clsx/lite";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import type React from "react";
import { PopoverContent } from "./popover";

interface MenuItem {
	value: string | number;
	label: string;
	icon?: React.ReactNode;
}

interface MenuGroup<T extends MenuItem> {
	groupId: string | number;
	groupLabel: string;
	items: Array<T>;
}

type MenuContent = MenuItem | MenuGroup<MenuItem>;

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
			) => TRenderItemAsChild extends true
				? React.ReactElement
				: React.ReactNode
		: (
				item: T[number],
			) => TRenderItemAsChild extends true
				? React.ReactElement
				: React.ReactNode;
	onSelect?: T[number] extends MenuGroup<infer I>
		? (event: Event, option: I) => void
		: (event: Event, option: T[number]) => void;
	widthClassName?: string;
	sideOffset?: DropdownMenuPrimitive.DropdownMenuContentProps["sideOffset"];
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
	widthClassName,
	sideOffset,
	align,
	open,
	onOpenChange,
}: DropdownMenuProps<T, TRenderItemAsChild>) {
	return (
		<DropdownMenuPrimitive.Root open={open} onOpenChange={onOpenChange}>
			<DropdownMenuPrimitive.Trigger asChild>
				{trigger}
			</DropdownMenuPrimitive.Trigger>
			<DropdownMenuPrimitive.Portal>
				<DropdownMenuPrimitive.Content
					sideOffset={sideOffset}
					align={align}
					className={clsx("z-10", widthClassName)}
				>
					<PopoverContent>
						{items.map((option) => {
							if (isGroupItem(option)) {
								return (
									<DropdownMenuPrimitive.Group key={option.groupId}>
										<DropdownMenuPrimitive.Label className="text-text-tertiary px-[8px] py-[6px] text-[12px] font-medium">
											{option.groupLabel}
										</DropdownMenuPrimitive.Label>
										{option.items.map((item) => (
											<DropdownMenuPrimitive.Item
												asChild={renderItemAsChild}
												key={item.value}
												onSelect={(event) => onSelect?.(event, item)}
												className={clsx(
													"text-text outline-none cursor-pointer hover:bg-ghost-element-hover",
													"rounded-[4px] px-[8px] py-[6px] text-[14px]",
													"flex items-center justify-between gap-[4px]",
												)}
											>
												{item.icon ? (
													<div className="flex items-center gap-2">
														<span className="h-4 w-4">{item.icon}</span>
														{renderItem ? renderItem(item) : item.label}
													</div>
												) : renderItem ? (
													renderItem(item)
												) : (
													item.label
												)}
											</DropdownMenuPrimitive.Item>
										))}
									</DropdownMenuPrimitive.Group>
								);
							}
							return (
								<DropdownMenuPrimitive.Item
									asChild={renderItemAsChild}
									key={option.value}
									onSelect={(event) => onSelect?.(event, option)}
									className={clsx(
										"text-text outline-none cursor-pointer hover:bg-ghost-element-hover",
										"rounded-[4px] px-[8px] py-[6px] text-[14px]",
										"flex items-center justify-between gap-[4px]",
									)}
								>
									{option.icon ? (
										<div className="flex items-center gap-2">
											<span className="h-4 w-4">{option.icon}</span>
											{renderItem ? renderItem(option) : option.label}
										</div>
									) : renderItem ? (
										renderItem(option)
									) : (
										option.label
									)}
								</DropdownMenuPrimitive.Item>
							);
						})}
					</PopoverContent>
				</DropdownMenuPrimitive.Content>
			</DropdownMenuPrimitive.Portal>
		</DropdownMenuPrimitive.Root>
	);
}
