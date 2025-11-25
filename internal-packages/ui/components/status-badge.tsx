import clsx from "clsx/lite";

interface StatusBadgeProps {
	status: "error" | "success" | "ignored" | "info" | "warning" | "primary";
	variant?: "default" | "dot";
	className?: string;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
}

const statusStyles = {
	error:
		"bg-[rgba(var(--color-error-rgb),0.05)] text-error border-[rgba(var(--color-error-rgb),0.1)]",
	success:
		"bg-[rgba(var(--color-success-rgb),0.05)] text-success border-[rgba(var(--color-success-rgb),0.1)]",
	warning:
		"bg-[rgba(var(--color-warning-rgb),0.05)] text-warning border-[rgba(var(--color-warning-rgb),0.1)]",
	info: "bg-[rgba(var(--color-info-rgb),0.05)] text-info border-[rgba(var(--color-info-rgb),0.1)]",
	ignored:
		"bg-[rgba(var(--color-ignored-rgb),0.05)] text-ignored border-[rgba(var(--color-ignored-rgb),0.1)]",
	primary: "bg-primary-400/5 text-primary-400 border-primary-400/10",
};

const dotStyles = {
	error: "bg-error",
	success: "bg-success",
	warning: "bg-warning",
	info: "bg-info",
	ignored: "bg-ignored",
	primary: "bg-primary-400",
};

const dotTextStyles = {
	error: "text-error",
	success: "text-success",
	warning: "text-warning",
	info: "text-info",
	ignored: "text-ignored",
	primary: "text-primary-400",
};

export function StatusBadge({
	status,
	variant = "default",
	className,
	leftIcon,
	rightIcon,
	children,
}: React.PropsWithChildren<StatusBadgeProps>) {
	if (variant === "dot") {
		return (
			<div
				className={clsx(
					"flex items-center px-2 py-1 rounded-full border border-white/20 w-fit",
					className,
				)}
			>
				<div
					className={clsx("w-2 h-2 rounded-full shrink-0", dotStyles[status])}
				/>
				<span
					className={clsx(
						"text-[12px] leading-[14px] font-medium font-geist ml-1.5",
						dotTextStyles[status],
					)}
				>
					{children}
				</span>
			</div>
		);
	}

	return (
		<div
			className={clsx("rounded-[4px] p-[1px] w-fit", className)}
			data-variant={status}
		>
			<div
				className={clsx(
					"px-[8px] py-[2px] rounded-[3px] text-[12px] flex items-center gap-[4px] border",
					statusStyles[status],
				)}
			>
				{leftIcon && <div className="*:size-[12px]">{leftIcon}</div>}
				{children}
				{rightIcon && <div className="*:size-[12px]">{rightIcon}</div>}
			</div>
		</div>
	);
}
