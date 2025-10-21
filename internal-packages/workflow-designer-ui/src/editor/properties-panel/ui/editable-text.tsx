"use client";

import clsx from "clsx/lite";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";

export interface EditableTextRef {
	triggerEdit: () => void;
}

export const EditableText = forwardRef<
	EditableTextRef,
	{
		value?: string;
		fallbackValue: string;
		onChange?: (value?: string) => void;
		size?: "medium" | "large";
		ariaLabel?: string;
		className?: string;
	}
>(function EditableText(
	{ value, fallbackValue, onChange, size = "medium", ariaLabel, className },
	ref,
) {
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

	useImperativeHandle(
		ref,
		() => ({
			triggerEdit: () => setEdit(true),
		}),
		[],
	);

	return (
		<>
			<input
				type="text"
				aria-label={ariaLabel}
				className={clsx(
					"w-full min-w-[200px] hidden data-[editing=true]:block",
					"outline-none border border-inverse/20 focus:border-inverse/30",
					"rounded-[8px] bg-inverse/5",
					"!pt-[2px] !pr-[8px] !pb-[2px] !pl-[12px]",
					"data-[size=medium]:text-[14px] data-[size=large]:text-[16px]",
					!className && "text-inverse",
					className,
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
				aria-label={ariaLabel}
				className={clsx(
					"rounded-[8px] data-[editing=true]:hidden text-left",
					"hover:bg-bg-900/20 group-hover:bg-bg-900/10",
					"bg-inverse/5 border border-inverse/20 !pt-[2px] !pr-[8px] !pb-[2px] !pl-[12px]",
					"data-[size=medium]:text-[14px] data-[size=large]:text-[16px]",
					"cursor-default w-full overflow-hidden text-ellipsis whitespace-nowrap",
					!className && "text-inverse",
					className,
				)}
				data-editing={edit}
				onClick={() => setEdit(true)}
				data-size={size}
			>
				{value ?? fallbackValue}
			</button>
		</>
	);
});
