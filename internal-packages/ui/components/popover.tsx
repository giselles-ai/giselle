import clsx from "clsx/lite";

export function PopoverContent(props: React.PropsWithChildren) {
	return (
		<div
			className={clsx(
				"rounded-[2px] bg-panel-background z-50",
				"p-[4px] border border-border-variant",
				"shadow-[1px_1px_0px_rgba(0,0,0,0.05),-1px_1px_0px_rgba(0,0,0,0.05),0_2px_6px_rgba(0,0,0,0.30)]",
			)}
			{...props}
		/>
	);
}
