import clsx from "clsx/lite";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { Tabs as TabsPrimitive } from "radix-ui";
import type { ComponentProps, FC } from "react";
import { PanelCloseIcon } from "../../../icons/panel-close";

const { Content, List, Root, Trigger } = TabsPrimitive;

export function TabsContent({
	className,
	children,
	...props
}: ComponentProps<typeof Content>) {
	return (
		<Content
			className={clsx(
				"overflow-y-auto overflow-x-hidden z-10 h-full text-black-300",
				className,
			)}
			{...props}
		>
			<div className="flex flex-col gap-[2px] h-full">{children}</div>
		</Content>
	);
}
TabsContent.displayName = Content.displayName;

export function Tabs({ className, ...props }: ComponentProps<typeof Root>) {
	const { propertiesTab, setPropertiesTab } = useWorkflowDesigner();
	return (
		<Root
			className={clsx(
				"h-full overflow-y-hidden flex flex-col w-full",
				className,
			)}
			value={propertiesTab}
			onValueChange={(v) => setPropertiesTab(v)}
			{...props}
		/>
	);
}

export function TabsList({ children, ...props }: ComponentProps<typeof List>) {
	const { setOpenPropertiesPanel } = useWorkflowDesigner();
	return (
		<List
			className="w-full flex items-center relative z-10 justify-between pl-[16px] pr-[24px] py-[10px] h-[56px]"
			{...props}
		>
			<button
				type="button"
				onClick={() => setOpenPropertiesPanel(false)}
				className="p-[8px]"
			>
				<PanelCloseIcon className="w-[18px] h-[18px] fill-black-70 hover:fill-black-300" />
			</button>
			<div className="flex items-center gap-[16px]">{children}</div>
		</List>
	);
}
TabsList.displayName = List.displayName;

export const TabsTrigger: FC<ComponentProps<typeof Trigger>> = ({
	ref,
	className,
	...props
}) => (
	<Trigger
		ref={ref}
		className="font-rosart text-[16px] text-black-70 hover:text-black-300/70 data-[state=active]:text-black-300 py-[6px] px-[2px]"
		{...props}
	/>
);
TabsTrigger.displayName = Trigger.displayName;
