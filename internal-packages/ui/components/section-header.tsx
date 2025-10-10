import clsx from "clsx/lite";

interface SectionHeaderProps {
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
}

export function SectionHeader({
	title,
	description,
	action,
	className,
}: SectionHeaderProps) {
	return (
		<div className={clsx("flex justify-between items-start", className)}>
			<div className="flex-1">
				<h4 className="text-text font-medium text-[18px] leading-[21.6px] font-sans">
					{title}
				</h4>
				{description && (
					<p className="text-text-muted text-[14px] leading-[20.4px] font-geist mt-1">
						{description}
					</p>
				)}
			</div>
			{action && <div className="ml-4">{action}</div>}
		</div>
	);
}
