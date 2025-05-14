import * as React from "react";

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type = "text", ...props }, ref) => {
		return (
			<input
				type={type}
				className={`flex w-full rounded-md bg-[hsla(207,43%,91%,0.2)] border border-transparent p-[12px] text-[14px] shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-black--50 disabled:cursor-not-allowed disabled:opacity-50${className ? ` ${className}` : ""}`}
				ref={ref}
				{...props}
			/>
		);
	},
);
Input.displayName = "Input";
