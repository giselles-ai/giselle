"use client";

import clsx from "clsx/lite";
import type { FormInput, ValidationErrors } from "./types";

interface FormInputRendererProps {
	inputs: FormInput[];
	validationErrors: ValidationErrors;
	isPending: boolean;
}

export function FormInputRenderer({
	inputs,
	validationErrors,
	isPending,
}: FormInputRendererProps) {
	return (
		<div className="flex flex-col gap-[8px] mb-[8px]">
			{inputs.map((input) => {
				return (
					<fieldset key={input.name} className={clsx("grid gap-2")}>
						<label
							className="text-[14px] font-medium text-white-900"
							htmlFor={input.name}
						>
							{input.label}
							{input.required && <span className="text-red-500 ml-1">*</span>}
						</label>
						{input.type === "text" && (
							<input
								type="text"
								name={input.name}
								id={input.name}
								required={input.required}
								aria-required={input.required}
								aria-invalid={!!validationErrors[input.name]}
								aria-describedby={
									validationErrors[input.name]
										? `${input.name}-error`
										: undefined
								}
								className={clsx(
									"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none border",
									validationErrors[input.name]
										? "border-error"
										: "border-white/5",
									"text-[14px]",
								)}
								disabled={isPending}
								tabIndex={isPending ? -1 : undefined}
							/>
						)}
						{input.type === "multiline-text" && (
							<textarea
								name={input.name}
								id={input.name}
								required={input.required}
								aria-required={input.required}
								aria-invalid={!!validationErrors[input.name]}
								aria-describedby={
									validationErrors[input.name]
										? `${input.name}-error`
										: undefined
								}
								className={clsx(
									"w-full rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
									"border-[1px]",
									validationErrors[input.name]
										? "border-error"
										: "border-white/5",
									"text-[14px]",
								)}
								rows={4}
								disabled={isPending}
								tabIndex={isPending ? -1 : undefined}
							/>
						)}
						{input.type === "number" && (
							<input
								type="number"
								name={input.name}
								id={input.name}
								required={input.required}
								aria-required={input.required}
								aria-invalid={!!validationErrors[input.name]}
								aria-describedby={
									validationErrors[input.name]
										? `${input.name}-error`
										: undefined
								}
								className={clsx(
									"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
									"border-[1px]",
									validationErrors[input.name]
										? "border-error"
										: "border-white/5",
									"text-[14px]",
								)}
								disabled={isPending}
								tabIndex={isPending ? -1 : undefined}
							/>
						)}
						{validationErrors[input.name] && (
							<span
								id={`${input.name}-error`}
								className="text-error text-[12px] font-medium"
								role="alert"
							>
								{validationErrors[input.name]}
							</span>
						)}
					</fieldset>
				);
			})}
		</div>
	);
}
