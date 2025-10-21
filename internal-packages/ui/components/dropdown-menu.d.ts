import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import type React from "react";
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
export declare function DropdownMenu<
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
}: DropdownMenuProps<
	T,
	TRenderItemAsChild
>): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=dropdown-menu.d.ts.map
