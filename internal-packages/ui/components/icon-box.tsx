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
				"bg-transparent hover:bg-inverse/10 focus-visible:bg-inverse/10",
				"outline-none focus-visible:outline-none",
				className,
			)}
		>
			{children}
		</button>
	);
}
