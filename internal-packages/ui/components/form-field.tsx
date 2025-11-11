"use client";

import clsx from "clsx/lite";
import { useId } from "react";

interface FormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "ref"> {
	label?: string;
	error?: string;
	hint?: string;
	containerClassName?: string;
}

export function FormField({
	label,
	error,
	hint,
	containerClassName,
	className,
	...props
}: FormFieldProps) {
	const id = useId();
	const inputId = props.id || id;

	return (
		<div className={clsx("space-y-1", containerClassName)}>
			{label && (
				<label htmlFor={inputId} className="text-text text-[14px] leading-[16.8px] font-sans">
					{label}
				</label>
			)}
			<input
				id={inputId}
				className={clsx(
					"w-full rounded-md bg-bg border border-border-muted px-3 py-2",
					"text-text placeholder:text-text/30",
					"focus:outline-none focus:ring-1 focus:ring-inverse/20",
					"disabled:opacity-50 disabled:cursor-not-allowed",
					error && "border-error-900 focus:ring-error-900/20",
					className,
				)}
				{...props}
			/>
			{hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
			{error && <p className="text-xs text-error-900">{error}</p>}
		</div>
	);
}
