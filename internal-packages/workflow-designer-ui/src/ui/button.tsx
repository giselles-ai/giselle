import clsx from "clsx/lite";
import type { ButtonHTMLAttributes, DetailedHTMLProps } from "react";

export function Button({
	className,
	children,
	loading = false,
	...props
}: DetailedHTMLProps<
	ButtonHTMLAttributes<HTMLButtonElement>,
	HTMLButtonElement
> & { loading?: boolean }) {
	return (
		<button
			data-loading={loading}
			className={clsx(
				"p-[1px] h-[34px]",
				"rounded-[8px] text-white-900",
				"text-[14px] cursor-pointer font-accent",
				"bg-linear-[var(--button-gradient-angle)] data-[loading=true]:animate-rotate-button-gradient-angle from-[hsl(0,_2%,_89%)]/60 via-[hsl(0,_2%,_89%)] to-[hsl(0,_0%,_36%)] from-30% via-50% to-100%",
				className,
			)}
			{...props}
		>
			<div className="px-[16px] bg-primary-900 rounded-[8px] flex items-center gap-[4px] h-full text-[14px] font-[700] justify-center">
				{children}
			</div>
		</button>
	);
}
