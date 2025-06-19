import clsx from "clsx/lite";

export function EmptyState({
	title,
	icon,
	description,
	children,
	className,
}: {
	title?: string;
	icon?: React.ReactNode;
	description?: string;
	className?: string;
	children?: React.ReactNode;
}) {
	return (
		<div className={clsx("flex flex-col items-center gap-[8px]", className)}>
			{icon}
			{title && <p className=" text-text">{title}</p>}
			{description && (
				<p className="text-text-muted text-[12px] text-center leading-5">
					{description}
				</p>
			)}
			{children}
		</div>
	);
}
