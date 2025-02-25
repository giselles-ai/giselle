"use client";

import clsx from "clsx/lite";
import { useCallback, useEffect, useRef, useState } from "react";

export function EditableText({
	value,
	fallbackValue,
	onChange,
}: {
	value?: string;
	fallbackValue: string;
	onChange?: (value?: string) => void;
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
		<div className="group" data-editing={edit}>
			<input
				type="text"
				className={clsx(
					"w-[200px] py-[2px] px-[4px] rounded-[4px] hidden group-data-[editing=true]:block",
					"outline-none ring-[1px] ring-primary-900",
					"text-white-900 text-[14px]",
				)}
				ref={inputRef}
				data-edit={edit}
				defaultValue={value ?? fallbackValue}
				onBlur={() => updateValue()}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						updateValue();
					}
				}}
			/>
			<button
				type="button"
				className={clsx(
					"py-[2px] px-[4px] rounded-[4px] group-data-[editing=true]:hidden",
					"hover:bg-white-900/20",
					"text-white-900 text-[14px]",
					"cursor-default",
				)}
				onClick={() => setEdit(true)}
			>
				{value ?? fallbackValue}
			</button>
		</div>
	);
}
