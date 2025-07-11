import clsx from "clsx/lite";
import { AlertTriangleIcon, InfoIcon, XCircleIcon } from "lucide-react";
import React from "react";

export type ErrorSeverity = "info" | "warning" | "error";

export interface ErrorDisplayProps {
	/**
	 * The error message to display
	 */
	message: string;

	/**
	 * Optional error details for technical information
	 */
	details?: string;

	/**
	 * The severity level of the error
	 * @default "error"
	 */
	severity?: ErrorSeverity;

	/**
	 * Optional action button text
	 */
	actionText?: string;

	/**
	 * Optional action callback
	 */
	onAction?: () => void;

	/**
	 * Optional dismiss callback
	 */
	onDismiss?: () => void;

	/**
	 * Additional class name
	 */
	className?: string;
}

/**
 * Component for displaying error messages with consistent styling
 */
export function ErrorDisplay({
	message,
	details,
	severity = "error",
	actionText,
	onAction,
	onDismiss,
	className,
}: ErrorDisplayProps) {
	// Select icon based on severity
	const Icon = React.useMemo(() => {
		switch (severity) {
			case "info":
				return InfoIcon;
			case "warning":
				return AlertTriangleIcon;
			default:
				return XCircleIcon;
		}
	}, [severity]);

	// Color classes based on severity
	const colorClasses = React.useMemo(() => {
		switch (severity) {
			case "info":
				return "border-blue-500 bg-blue-500/10 text-blue-400";
			case "warning":
				return "border-yellow-500 bg-yellow-500/10 text-yellow-400";
			default:
				return "border-red-500 bg-red-500/10 text-red-400";
		}
	}, [severity]);

	return (
		<div
			className={clsx(
				"rounded-md border p-4 mb-4 flex flex-col gap-2",
				colorClasses,
				className,
			)}
			role={severity === "error" ? "alert" : "status"}
			aria-live={severity === "error" ? "assertive" : "polite"}
		>
			<div className="flex items-start gap-3">
				<Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
				<div className="flex-1 text-sm">
					<p className="font-medium">{message}</p>
					{details && (
						<p className="mt-1 text-xs opacity-80 whitespace-pre-wrap">
							{details}
						</p>
					)}
				</div>
				{onDismiss && (
					<button
						type="button"
						className="opacity-70 hover:opacity-100 transition-opacity"
						onClick={onDismiss}
						aria-label="Dismiss"
					>
						<XCircleIcon className="h-4 w-4" />
					</button>
				)}
			</div>

			{actionText && onAction && (
				<div className="ml-8 mt-1">
					<button
						type="button"
						className="text-sm font-medium underline hover:opacity-80 transition-opacity"
						onClick={onAction}
					>
						{actionText}
					</button>
				</div>
			)}
		</div>
	);
}

/**
 * Formats error objects into user-friendly messages
 */
export function formatErrorMessage(error: unknown): {
	message: string;
	details?: string;
} {
	if (typeof error === "string") {
		return { message: error };
	}

	if (error instanceof Error) {
		return {
			message: error.message || "An unexpected error occurred",
			details: error.stack,
		};
	}

	// Handle API errors
	if (error && typeof error === "object" && "message" in error) {
		return {
			message: String(error.message) || "API Error",
			details: JSON.stringify(error, null, 2),
		};
	}

	return {
		message: "An unexpected error occurred",
		details: error ? JSON.stringify(error, null, 2) : undefined,
	};
}

/**
 * Helper component for network errors with retry action
 */
export function NetworkErrorDisplay({
	onRetry,
	className,
}: {
	onRetry: () => void;
	className?: string;
}) {
	return (
		<ErrorDisplay
			message="Network error occurred"
			details="Could not connect to the server. Please check your internet connection."
			severity="error"
			actionText="Retry"
			onAction={onRetry}
			className={className}
		/>
	);
}

/**
 * Helper component for validation errors
 */
export function ValidationErrorDisplay({
	message,
	className,
}: {
	message: string;
	className?: string;
}) {
	return (
		<ErrorDisplay
			message="Validation Error"
			details={message}
			severity="warning"
			className={className}
		/>
	);
}
