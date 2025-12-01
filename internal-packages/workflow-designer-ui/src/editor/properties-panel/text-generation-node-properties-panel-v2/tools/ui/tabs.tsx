import clsx from "clsx/lite";
import { Tabs as TabsPrimitive } from "radix-ui";

export const Tabs = TabsPrimitive.Root;

export function TabsList({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
	return (
		<TabsPrimitive.List
			className={clsx(
				"border border-border px-[2px] py-[2px] rounded-[4px] flex justify-center items-center gap-[4px]",
				"**:data-trigger:flex-1 **:data-trigger:rounded-[4px] **:data-trigger:border **:data-trigger:border-transparent",
				"**:data-trigger:outline-none **:data-trigger:text-text-muted **:data-trigger:font-accent",
				"**:data-trigger:text-[13px] **:data-trigger:tracking-wider **:data-trigger:py-[3px]",
				"**:data-trigger:data-[state=active]:bg-tab-active-background **:data-trigger:data-[state=active]:text-text",
				"**:data-trigger:data-[state=inactive]:cursor-pointer",
				"**:data-trigger:hover:bg-ghost-element-hover",
				className,
			)}
			{...props}
		/>
	);
}

export function TabsTrigger({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			className={clsx(
				"flex-1 rounded-[4px] border border-transparent",
				"outline-none text-text-muted font-accent",
				"text-[13px] tracking-wider py-[3px]",
				"data-[state=active]:bg-tab-active-background data-[state=active]:text-text",
				"data-[state=inactive]:cursor-pointer",
				"hover:bg-ghost-element-hover",
				className,
			)}
			{...props}
		/>
	);
}

export function TabsContent({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content
			className={clsx("outline-none", className)}
			{...props}
		/>
	);
}
