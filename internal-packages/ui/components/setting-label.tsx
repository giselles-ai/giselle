import clsx from "clsx/lite";

export function SettingLabel({
	children,
	kind = "section",
	size = "sm",
	inline = false,
	widthClassName,
	className,
	htmlFor,
	colorClassName = "text-secondary",
}: {
	children: React.ReactNode;
	kind?: "section" | "field";
	size?: "sm" | "md" | "lg"; // sm=12, md=14, lg=16
	inline?: boolean;
	widthClassName?: string; // e.g. w-[140px] for aligned rows
	className?: string;
	htmlFor?: string;
	colorClassName?: string; // e.g. text-text, text-text/80, text-inverse
}) {
	// Default: label is 12px (sm is default for both section/field)
	const fallbackSize = kind === "field" ? "text-[16px]" : "text-[12px]";
	const sizeClass =
		size === "sm"
			? "text-[12px]"
			: size === "lg"
				? "text-[16px]"
				: size === "md"
					? "text-[14px]"
					: fallbackSize;
	const Comp = (htmlFor ? "label" : "div") as keyof JSX.IntrinsicElements;
	return (
		<Comp
			// @ts-expect-error htmlFor only valid on label; ignored for div
			htmlFor={htmlFor}
			className={clsx(
				colorClassName,
				sizeClass,
				inline ? "inline-block" : "block",
				widthClassName,
				className,
			)}
		>
			{children}
		</Comp>
	);
}

export function SettingDetail({
	children,
	className,
	size = "md",
	colorClassName = "text-text",
}: {
	children: React.ReactNode;
	className?: string;
	size?: "sm" | "md"; // sm=13, md=14
	colorClassName?: string;
}) {
	// Default: detail is 14px
	const sizeClass = size === "md" ? "text-[14px]" : "text-[13px]";
	return (
		<div className={clsx(colorClassName, sizeClass, className)}>{children}</div>
	);
}
