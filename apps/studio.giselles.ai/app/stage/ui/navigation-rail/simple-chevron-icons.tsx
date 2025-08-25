import type { ComponentProps } from "react";

interface IconProps extends ComponentProps<"svg"> {
	className?: string;
}

export function SimpleChevronLeft({ className, ...props }: IconProps) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			role="img"
			aria-label="Collapse sidebar"
			{...props}
		>
			<path d="M11 17l-5-5 5-5" />
			<path d="M18 17l-5-5 5-5" />
		</svg>
	);
}

export function SimpleChevronRight({ className, ...props }: IconProps) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			role="img"
			aria-label="Expand sidebar"
			{...props}
		>
			<path d="M13 17l5-5-5-5" />
			<path d="M6 17l5-5-5-5" />
		</svg>
	);
}
