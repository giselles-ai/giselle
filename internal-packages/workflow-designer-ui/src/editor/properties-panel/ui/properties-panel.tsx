"use client";

import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { EditableText } from "./editable-text";

export function PropertiesPanelRoot({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<div className="h-full w-full flex flex-col gap-[8px] overflow-hidden">
			{children}
		</div>
	);
}

export function PropertiesPanelHeader({
	name,
	fallbackName: propsFallbackName,
	description,
	icon,
	onChangeName,
	action,
}: {
	name?: string;
	fallbackName?: string;
	description?: string;
	icon: ReactNode;
	onChangeName?: (name?: string) => void;
	action?: ReactNode;
}) {
	const [edit, setEdit] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (edit) {
			inputRef.current?.select();
			inputRef.current?.focus();
		}
	}, [edit]);
	const fallbackName = useMemo(
		() => propsFallbackName ?? "Unnamed Node",
		[propsFallbackName],
	);
	const updateName = useCallback(() => {
		if (!inputRef.current) {
			return;
		}
		setEdit(false);
		const currentValue =
			inputRef.current.value.length === 0 ? undefined : inputRef.current.value;
		if (fallbackName === currentValue) {
			return;
		}
		onChangeName?.(currentValue);
		inputRef.current.value = currentValue ?? fallbackName;
	}, [onChangeName, fallbackName]);
	return (
		<div className="h-[48px] flex justify-between items-center px-[16px] shrink-0">
			<div className="flex gap-[8px] items-center">
				<div className="w-[28px] h-[28px] bg-white-900 rounded-[4px] flex items-center justify-center">
					{icon}
				</div>
				<div>
					<EditableText
						onChange={(value) => onChangeName?.(value)}
						value={name}
						fallbackValue={fallbackName}
					/>
					{description && (
						<p className="px-[5px] text-white-400 text-[10px]">{description}</p>
					)}
				</div>
			</div>
			{action}
		</div>
	);
}

export function PropertiesPanelContent({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<div className="px-[16px] flex-1 h-full flex flex-col overflow-hidden">
			{children}
		</div>
	);
}
