"use client";

import clsx from "clsx/lite";
import {
	type HTMLAttributes,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

export function EditableText({
	className,
	text,
	onValueChange,
	onClickToEditMode,
	inputClassName,
	buttonClassName,
	...props
}: HTMLAttributes<HTMLDivElement> & {
	text?: string;
	onValueChange?: (value: string) => void;
	onClickToEditMode?: (e: React.MouseEvent<HTMLButtonElement>) => void;
	inputClassName?: string;
	buttonClassName?: string;
}) {
	const [edit, setEdit] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (edit) {
			inputRef.current?.select();
			inputRef.current?.focus();
		}
	}, [edit]);

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.value = text ?? "";
		}
	}, [text]);

	const updateText = useCallback(() => {
		setEdit(false);
		const newTextValue = inputRef.current?.value ?? "";
		onValueChange?.(newTextValue);
	}, [onValueChange]);

	return (
		<div className={className} {...props}>
			<input
				type="text"
				className={clsx(
					"rounded-[4px] hidden data-[editing=true]:block w-full",
					"outline-none ring-[1px] ring-primary-900",
					"text-inverse text-[14px]",
					inputClassName,
				)}
				ref={inputRef}
				data-input
				data-editing={edit}
				onBlur={() => updateText()}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						updateText();
					}
				}}
			/>
			<button
				type="button"
				className={clsx(
					"rounded-l-[4px] last:rounded-r-[4px] data-[editing=true]:hidden",
					"hover:bg-bg-900/20",
					"text-inverse text-[14px]",
					"cursor-default",
					"!border-0",
					buttonClassName,
				)}
				data-button
				data-editing={edit}
				onClick={(e) => {
					onClickToEditMode?.(e);
					if (e.isDefaultPrevented()) {
						return;
					}
					setEdit(true);
				}}
			>
				{text}
			</button>
		</div>
	);
}
