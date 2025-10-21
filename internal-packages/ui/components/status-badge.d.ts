interface StatusBadgeProps {
	status: "error" | "success" | "ignored" | "info" | "warning";
	variant?: "default" | "dot";
	className?: string;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
}
export declare function StatusBadge({
	status,
	variant,
	className,
	leftIcon,
	rightIcon,
	children,
}: React.PropsWithChildren<StatusBadgeProps>): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=status-badge.d.ts.map
