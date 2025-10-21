import clsx from "clsx/lite";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

const statusConfig = {
	idle: {
		dotColor: "bg-blue-400",
		label: "Idle",
	},
	pending: {
		dotColor: "bg-yellow-500",
		label: "Pending",
	},
	running: {
		dotColor: "bg-green-500 animate-pulse",
		label: "Running",
	},
	completed: {
		dotColor: "bg-green-500",
		label: "Ready",
	},
	failed: {
		dotColor: "bg-error-900",
		label: "Error",
	},
};
const sizeConfig = {
	sm: "h-2 w-2",
	md: "h-3 w-3",
	lg: "h-4 w-4",
};
export function StatusIndicator({
	status,
	label,
	showLabel = true,
	size = "md",
	className,
}) {
	const config = statusConfig[status];
	const displayLabel = label || config.label;
	return _jsxs("div", {
		className: clsx("flex items-center gap-2", className),
		children: [
			_jsx("div", {
				className: clsx("rounded-full", sizeConfig[size], config.dotColor),
			}),
			showLabel &&
				_jsx("span", {
					className: "text-text-muted text-sm",
					children: displayLabel,
				}),
		],
	});
}
//# sourceMappingURL=status-indicator.js.map
