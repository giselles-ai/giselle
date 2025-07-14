"use client";

import clsx from "clsx/lite";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import type React from "react";
import { PopoverContent } from "./popover";

interface Identifiable {
	id: string | number;
}

interface GroupItem<T extends Identifiable> {
	groupId: string | number;
	groupLabel: string;
	items: Array<T>;
}

type ItemLike = Identifiable | GroupItem<Identifiable>;

interface DropdownMenuProps<
	T extends Array<ItemLike>,
	TRenderItemAsChild extends boolean,
> {
	items: T;
	trigger: React.ReactNode;
	renderItemAsChild?: TRenderItemAsChild;
	renderItem: T[number] extends GroupItem<infer I>
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
	onSelect?: T[number] extends GroupItem<infer I>
		? (event: Event, option: I) => void
		: (event: Event, option: T[number]) => void;
	widthClassName?: string;
	sideOffset?: DropdownMenuPrimitive.DropdownMenuContentProps["sideOffset"];
	align?: DropdownMenuPrimitive.DropdownMenuContentProps["align"];
	open?: DropdownMenuPrimitive.DropdownMenuProps["open"];
	onOpenChange?: DropdownMenuPrimitive.DropdownMenuProps["onOpenChange"];
}

function isGroupItem<T extends Identifiable>(
	option: T | GroupItem<T>,
): option is GroupItem<T> {
	return (
		"groupLabel" in option && Array.isArray((option as GroupItem<T>).items)
	);
}

export function DropdownMenu<
	T extends Array<ItemLike>,
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
					className={clsx("z-10 max-h-[250px]", widthClassName)}
				>
					<PopoverContent className="max-h-[230px] overflow-y-auto">
						{items.map((option) => {
							if (isGroupItem(option)) {
								return (
									<DropdownMenuPrimitive.Group key={option.groupId}>
										<DropdownMenuPrimitive.Label
											className="px-[8px] py-[6px]"
											style={{
												color: "var(--black-400, #505D7B)",
												fontFamily: "Hubot Sans",
												fontSize: "10px",
												fontStyle: "normal",
												fontWeight: 700,
												lineHeight: "140%",
												letterSpacing: "-0.11px",
											}}
										>
											{option.groupLabel}
										</DropdownMenuPrimitive.Label>
										{option.items.map((item) => (
											<DropdownMenuPrimitive.Item
												asChild={renderItemAsChild}
												key={item.id}
												onSelect={(event) => onSelect?.(event, item)}
												className={clsx(
													"text-text outline-none cursor-pointer hover:bg-ghost-element-hover",
													"rounded-[4px] px-[8px] py-[6px] text-[14px]",
													"flex items-center justify-between gap-[4px]",
												)}
											>
												{renderItem(item)}
											</DropdownMenuPrimitive.Item>
										))}
									</DropdownMenuPrimitive.Group>
								);
							}
							return (
								<DropdownMenuPrimitive.Item
									asChild={renderItemAsChild}
									key={option.id}
									onSelect={(event) => onSelect?.(event, option)}
									className={clsx(
										"text-text outline-none cursor-pointer hover:bg-ghost-element-hover",
										"rounded-[4px] px-[8px] py-[6px] text-[14px]",
										"flex items-center justify-between gap-[4px]",
									)}
								>
									{renderItem(option)}
								</DropdownMenuPrimitive.Item>
							);
						})}
					</PopoverContent>
				</DropdownMenuPrimitive.Content>
			</DropdownMenuPrimitive.Portal>
		</DropdownMenuPrimitive.Root>
	);
}
