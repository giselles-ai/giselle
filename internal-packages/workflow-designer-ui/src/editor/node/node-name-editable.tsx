import { useCallback, useEffect, useRef, useState } from "react";

export function NodeNameEditable({
	name,
	onNodeNameChange,
}: {
	name: string;
	onNodeNameChange?: (name: string) => void;
}) {
	const [editing, setEditing] = useState(false);
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (ref.current == null) {
			return;
		}
		if (editing) {
			ref.current.focus();
			ref.current.select();
		}
	}, [editing]);
	const commit = useCallback(() => {
		setEditing(false);
		if (ref.current) {
			onNodeNameChange?.(ref.current.value);
		}
	}, [onNodeNameChange]);
	return (
		<div className="absolute text-black-300 font-sans text-[12px] -translate-y-full left-[8px] -top-[2px]">
			{editing ? (
				<input
					type="text"
					defaultValue={name}
					ref={ref}
					onBlur={() => {
						commit();
					}}
					onKeyDown={(event) => {
						if (event.key === "Escape") {
							setEditing(false);
						}
						if (event.key === "Enter") {
							commit();
						}
					}}
					className="bg-transparent outline-none"
				/>
			) : (
				<button
					type="button"
					className="flex items-center gap-[12px] cursor-auto"
					onClick={(event) => {
						event.stopPropagation();
					}}
					onDoubleClick={() => {
						setEditing(true);
					}}
				>
					{name}
				</button>
			)}
		</div>
	);
}
