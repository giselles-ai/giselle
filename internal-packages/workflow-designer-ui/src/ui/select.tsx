"use client";

import clsx from "clsx/lite";
import {
	Check,
	ChevronDown,
	ChevronUp,
	ChevronsUpDownIcon,
} from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

function SelectTrigger({
	className,
	children,
	...props
}: SelectPrimitive.SelectTriggerProps) {
	return (
		<SelectPrimitive.Trigger
			className={clsx(
				"group w-full flex justify-between items-center rounded-[8px] py-[8px] px-[16px] outline-none focus:outline-none",
				"border-[1px] border-white-900",
				"text-[14px]",
				// "data-[state=closed]:**:data-icon:opacity-50 data-[state=open]:**:data-icon:opacity-100 ",
				className,
			)}
			{...props}
		>
			{children}
			<SelectPrimitive.Icon asChild>
				<ChevronsUpDownIcon className="h-[12px] w-[12px] opacity-50 group-hover:opacity-80 group-data-[state=open]:opacity-100" />
			</SelectPrimitive.Icon>
		</SelectPrimitive.Trigger>
	);
}
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

function SelectScrollUpButton({
	className,
	...props
}: SelectPrimitive.SelectScrollUpButtonProps) {
	return (
		<SelectPrimitive.ScrollUpButton
			className={clsx(
				"flex cursor-default items-center justify-center py-1",
				className,
			)}
			{...props}
		>
			<ChevronUp className="h-4 w-4" />
		</SelectPrimitive.ScrollUpButton>
	);
}
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

function SelectScrollDownButton({
	className,
	...props
}: SelectPrimitive.SelectScrollDownButtonProps) {
	return (
		<SelectPrimitive.ScrollDownButton
			className={clsx(
				"flex cursor-default items-center justify-center py-1",
				className,
			)}
			{...props}
		>
			<ChevronDown className="h-4 w-4" />
		</SelectPrimitive.ScrollDownButton>
	);
}
SelectScrollDownButton.displayName =
	SelectPrimitive.ScrollDownButton.displayName;

function SelectContent({
	className,
	children,
	position = "popper",
	...props
}: SelectPrimitive.SelectContentProps) {
	return (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Content
				className={clsx(
					"relative z-50 max-h-96 overflow-hidden rounded-[8px]",
					"border-[1px] border-white-900 bg-black-900 text-white-900",
					position === "popper" &&
						"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
					className,
				)}
				position={position}
				{...props}
			>
				<SelectScrollUpButton />
				<SelectPrimitive.Viewport
					className={clsx(
						"p-1",
						position === "popper" &&
							"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
					)}
				>
					{children}
				</SelectPrimitive.Viewport>
				<SelectScrollDownButton />
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	);
}
SelectContent.displayName = SelectPrimitive.Content.displayName;

function SelectLabel({
	className,
	...props
}: SelectPrimitive.SelectLabelProps) {
	return (
		<SelectPrimitive.Label
			className={clsx("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
			{...props}
		/>
	);
}
SelectLabel.displayName = SelectPrimitive.Label.displayName;

function SelectItem({ children, ...props }: SelectPrimitive.SelectItemProps) {
	return (
		<SelectPrimitive.Item
			className={clsx(
				"relative flex w-full cursor-default select-none items-center rounded-[4px] py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-white-900/20 focus:text-white-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
			)}
			{...props}
		>
			<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
				<SelectPrimitive.ItemIndicator>
					<Check className="h-4 w-4" />
				</SelectPrimitive.ItemIndicator>
			</span>

			<div>
				<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
			</div>
		</SelectPrimitive.Item>
	);
}
SelectItem.displayName = SelectPrimitive.Item.displayName;

function SelectSeparator({
	className,
	...props
}: SelectPrimitive.SelectSeparatorProps) {
	return (
		<SelectPrimitive.Separator
			className={clsx("-mx-1 my-1 h-px bg-muted", className)}
			{...props}
		/>
	);
}
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
	Select,
	SelectGroup,
	SelectValue,
	SelectTrigger,
	SelectContent,
	SelectLabel,
	SelectItem,
	SelectSeparator,
	SelectScrollUpButton,
	SelectScrollDownButton,
};
