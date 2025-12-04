import clsx from "clsx/lite";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function IconBox({
	children,
	className,
	"aria-label": ariaLabel,
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
	return (
		<button
			{...props}
			aria-label={ariaLabel}
			className={clsx(
				"relative inline-flex items-center justify-center",
				"rounded-[6px] size-[24px]",
				"text-text/80",
				"transition-colors duration-150",
				"bg-transparent hover:bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] focus-visible:bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)]",
				"outline-none focus-visible:outline-none",
				className,
			)}
		>
			{children}
		</button>
	);
}
