import clsx from "clsx/lite";
import { Popover as PopoverPrimitive } from "radix-ui";
import { GlassSurfaceLayers } from "./glass-surface";

export function PopoverContent(props: React.PropsWithChildren) {
	return (
		<div
			className={clsx(
				"relative rounded-[8px] p-[4px] shadow-xl flex flex-col min-h-0 h-full",
			)}
			{...props}
		>
			<GlassSurfaceLayers
				radiusClass="rounded-[8px]"
				borderStyle="solid"
				withTopHighlight={true}
				withBaseFill={true}
			/>
			<div className="relative z-10 overflow-y-auto flex-1 min-h-0">
			{props.children}
			</div>
		</div>
	);
}

export function Popover({
	trigger,
	children,
}: React.PropsWithChildren<{
	trigger: React.ReactNode;
}>) {
	return (
		<PopoverPrimitive.Root>
			<PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Content asChild>
					<PopoverContent>{children}</PopoverContent>
				</PopoverPrimitive.Content>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
}
