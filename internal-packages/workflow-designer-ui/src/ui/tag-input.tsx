import { XIcon } from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import { Button } from "./button";

export type Tag = {
	id: string;
	label: string;
};

type TagInputProps = {
	tags: Tag[];
	onAddTag: (value: string) => void;
	onRemoveTag: (id: string) => void;
	placeholder?: string;
	className?: string;
	label?: string;
	buttonLabel?: string;
};

export function TagInput({
	tags,
	onAddTag,
	onRemoveTag,
	placeholder = "タグを入力...",
	className = "",
	label,
	buttonLabel = "Add",
}: TagInputProps) {
	const [inputValue, setInputValue] = useState("");

	const handleAddTag = () => {
		if (inputValue.trim() !== "") {
			onAddTag(inputValue.trim());
			setInputValue("");
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleAddTag();
		}
	};

	const inputId = `tag-input-${Math.random().toString(36).substr(2, 9)}`;

	return (
		<div className="w-full">
			{label && (
				<label htmlFor={inputId} className="block text-sm font-medium mb-1">
					{label}
				</label>
			)}
			<div className={`flex flex-col gap-2 ${className}`}>
				{/* タグ表示エリア */}
				{tags.length > 0 && (
					<div className="flex flex-wrap gap-2 mb-2">
						{tags.map((tag) => (
							<div
								key={tag.id}
								className="flex items-center bg-gray-800 text-white rounded px-2 py-1"
							>
								<span className="mr-1 text-sm">{tag.label}</span>
								<button
									type="button"
									onClick={() => onRemoveTag(tag.id)}
									className="text-gray-300 hover:text-white"
								>
									<XIcon className="h-3 w-3" />
								</button>
							</div>
						))}
					</div>
				)}

				{/* 入力エリア */}
				<div className="flex w-full">
					<input
						id={inputId}
						type="text"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
						className="flex-grow border-none focus:ring-0 focus:outline-none bg-transparent text-gray-300 p-0 text-sm"
					/>
					<Button
						className="rounded-l-none"
						onClick={handleAddTag}
						disabled={inputValue.trim() === ""}
					>
						{buttonLabel}
					</Button>
				</div>
			</div>
		</div>
	);
}

// 簡単な使用例
export function TagInputExample() {
	const [tags, setTags] = useState<Tag[]>([]);

	const handleAddTag = (value: string) => {
		const newTag: Tag = {
			id: Date.now().toString(),
			label: value,
		};
		setTags([...tags, newTag]);
	};

	const handleRemoveTag = (id: string) => {
		setTags(tags.filter((tag) => tag.id !== id));
	};

	return (
		<div className="p-4 border rounded">
			<TagInput
				tags={tags}
				onAddTag={handleAddTag}
				onRemoveTag={handleRemoveTag}
				placeholder="タグを追加"
				buttonLabel="追加"
			/>
		</div>
	);
}
