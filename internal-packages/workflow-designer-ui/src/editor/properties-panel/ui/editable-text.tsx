"use client";

import clsx from "clsx/lite";
import { useCallback, useEffect, useRef, useState } from "react";

export function EditableText({
	value,
	fallbackValue,
	onChange,
	size = "medium",
}: {
	value?: string;
	fallbackValue: string;
	onChange?: (value?: string) => void;
	size?: "medium" | "large";
}) {
	const [edit, setEdit] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (edit) {
			inputRef.current?.select();
			inputRef.current?.focus();
		}
	}, [edit]);

	const updateValue = useCallback(() => {
		if (!inputRef.current) {
			return;
		}
		setEdit(false);
		const currentValue =
			inputRef.current.value.length === 0 ? undefined : inputRef.current.value;
		if (fallbackValue === currentValue) {
			return;
		}
		onChange?.(currentValue);
		inputRef.current.value = currentValue ?? fallbackValue;
	}, [onChange, fallbackValue]);

	return (
		<>
			<input
				type="text"
				className={clsx(
					"w-full py-[2px] px-[4px] rounded-[4px] hidden data-[editing=true]:block",
					"outline-none ring-[1px] ring-primary-900",
					"text-white-900",
					"data-[size=medium]:text-[14px] data-[size=large]:text-[16px]",
				)}
				ref={inputRef}
				data-editing={edit}
				defaultValue={value ?? fallbackValue}
				onBlur={() => updateValue()}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						updateValue();
					}
				}}
				data-size={size}
			/>
			<button
				type="button"
				className={clsx(
					"py-[2px] px-[4px] rounded-[4px] data-[editing=true]:hidden text-left",
					"hover:bg-white-900/20 group-hover:bg-white-900/10",
					"text-white-900",
					"data-[size=medium]:text-[14px] data-[size=large]:text-[16px]",
					"cursor-default w-full",
				)}
				data-editing={edit}
				onClick={() => setEdit(true)}
				data-size={size}
			>
				{value ?? fallbackValue}
			</button>
		</>
	);
}
