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
	readonly = false,
	...props
}: HTMLAttributes<HTMLDivElement> & {
	text?: string;
	onValueChange?: (value: string) => void;
	onClickToEditMode?: (e: React.MouseEvent<HTMLButtonElement>) => void;
	inputClassName?: string;
	buttonClassName?: string;
	readonly?: boolean;
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
					"text-inverse text-[14px]",
					"!border-0",
					!readonly && "hover:bg-bg-900/20",
					buttonClassName,
				)}
				data-button
				data-editing={edit}
				data-readonly={readonly}
				onClick={(e) => {
					if (readonly) {
						return;
					}
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
