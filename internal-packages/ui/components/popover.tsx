import clsx from "clsx/lite";
import { Popover as PopoverPrimitive } from "radix-ui";
import { GlassSurfaceLayers } from "./glass-surface";

export function PopoverContent({
	widthClassName,
	...props
}: React.PropsWithChildren<{ widthClassName?: string }>) {
	return (
		<div
			className={clsx(
				// Match profile dropdown styling (rounded-xl, p-2, custom shadow)
				"relative rounded-xl p-2 shadow-[0_2px_8px_rgba(5,10,20,0.4),0_1px_2px_rgba(0,0,0,0.3)] flex flex-col min-h-0 h-full z-50",
				widthClassName,
			)}
			{...props}
		>
			<GlassSurfaceLayers
				// Use larger radius to align with profile dropdown
				radiusClass="rounded-[12px]"
				borderStyle="solid"
				// Match profile dropdown: main border without extra opacity, aux hairline at 20%
				borderOpacityClass=""
				auxHairlineOpacityClass="opacity-20"
				// Use semantic color-mix instead of raw color utility
				baseFillMixPercent={40}
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
	align,
	sideOffset,
	children,
	widthClassName,
}: React.PropsWithChildren<{
	align?: PopoverPrimitive.PopoverContentProps["align"];
	sideOffset?: PopoverPrimitive.PopoverContentProps["sideOffset"];
	widthClassName?: string;
	trigger: React.ReactNode;
}>) {
	return (
		<PopoverPrimitive.Root>
			<PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Content asChild align={align} sideOffset={sideOffset}>
					<PopoverContent widthClassName={widthClassName}>
						{children}
					</PopoverContent>
				</PopoverPrimitive.Content>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
}
