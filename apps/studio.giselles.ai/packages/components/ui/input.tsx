import { cn } from "@/lib/utils";
import clsx from "clsx/lite";
import type { InputHTMLAttributes } from "react";

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({
	className,
	type,
	...props
}: InputHTMLAttributes<HTMLInputElement>) {
	return (
		<input
			type={type}
			className={clsx(
				"flex w-full rounded-md bg-[hsla(207,43%,91%,0.2)] border border-transparent p-[12px] text-[12px] shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-black--50 disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

Input.displayName = "Input";
