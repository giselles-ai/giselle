export type Status = "idle" | "running" | "completed" | "failed" | "pending";
interface StatusIndicatorProps {
	status: Status;
	label?: string;
	showLabel?: boolean;
	size?: "sm" | "md" | "lg";
	className?: string;
}
export declare function StatusIndicator({
	status,
	label,
	showLabel,
	size,
	className,
}: StatusIndicatorProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=status-indicator.d.ts.map
