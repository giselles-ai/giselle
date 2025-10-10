import clsx from "clsx/lite";

type SeparatorVariant = "default" | "inverse";
type SeparatorOrientation = "horizontal" | "vertical";

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: SeparatorVariant;
	orientation?: SeparatorOrientation;
}

export function Separator({
	className,
	variant = "default",
	orientation = "horizontal",
	...props
}: SeparatorProps) {
	const isVertical = orientation === "vertical";
	return (
		<div
			aria-hidden
			data-variant={variant}
			data-orientation={orientation}
			className={clsx(
				"shrink-0",
				// sizing
				isVertical ? "w-px h-full" : "h-px w-full",
				// single hairline using border only (avoid double line)
				isVertical ? "border-l border-border" : "border-t border-border",
				// allow inverse styling hook (color mapping can be updated later)
				"data-[variant=inverse]:border-border",
				className,
			)}
			{...props}
		/>
	);
}
