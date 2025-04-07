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
	showEdit,
	...props
}: HTMLAttributes<HTMLDivElement> & {
	text?: string;
	onValueChange?: (value: string) => void;
	onClickToEditMode?: (e: React.MouseEvent<HTMLButtonElement>) => void;
	showEdit?: boolean;
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
					"py-[2px] px-[4px] rounded-[4px] hidden data-[editing=true]:block",
					"outline-none ring-[1px] ring-primary-900",
					"text-white-900 text-[14px]",
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
					"flex items-center justify-between gap-[8px] py-[2px] px-[4px] rounded-l-[4px] last:rounded-r-[4px] data-[editing=true]:hidden",
					"hover:bg-white-900/20",
					"text-white-900 text-[14px]",
					"cursor-default",
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
				{showEdit && (
					<div className="py-[4px] px-[10px] border border-white-900 rounded-[8px] text-white-900 font-bold text-[12px] font-hubot">
						Edit
					</div>
				)}
			</button>
		</div>
	);
}
