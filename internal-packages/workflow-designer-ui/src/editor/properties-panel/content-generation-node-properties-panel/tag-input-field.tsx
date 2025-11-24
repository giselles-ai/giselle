import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { ConfigurationFormFieldLabel } from "./configuration-form-field-label";

export interface TagInputFieldProps {
	label: string;
	value: string[];
	onValueChange: (value: string[]) => void;
	placeholder?: string;
	description?: string;
	validate?: (value: string) => { isValid: boolean; message?: string };
}

export function TagInputField({
	label,
	value,
	onValueChange,
	placeholder = "Add tags (separate with commas)",
	description,
	validate,
}: TagInputFieldProps) {
	const [inputValue, setInputValue] = useState("");
	const [errors, setErrors] = useState<
		{ message: string; values?: string[] }[]
	>([]);

	const addTags = () => {
		if (!inputValue.trim()) return;

		// Parse tags
		const tags = inputValue
			.trim()
			.split(/[,;\s]+/)
			.map((tag) => tag.trim())
			.filter(Boolean);

		// Remove duplicates within the input batch
		const uniqueTags = [...new Set(tags)];

		const validTags: string[] = [];
		const invalidTags: string[] = [];
		const duplicateTags: string[] = [];

		for (const tag of uniqueTags) {
			if (validate) {
				const validation = validate(tag);
				if (!validation.isValid) {
					invalidTags.push(tag);
					continue;
				}
			}

			if (value.includes(tag)) {
				duplicateTags.push(tag);
			} else {
				validTags.push(tag);
			}
		}

		// Show errors
		const errorList: { message: string; values?: string[] }[] = [];
		if (invalidTags.length > 0) {
			errorList.push({
				message: "Invalid format",
				values: invalidTags,
			});
		}
		if (duplicateTags.length > 0) {
			errorList.push({ message: "Already added", values: duplicateTags });
		}
		if (errorList.length > 0) {
			setErrors(errorList);
		} else {
			setErrors([]);
		}

		// Add valid tags
		if (validTags.length > 0) {
			onValueChange([...value, ...validTags]);
		}

		// Update input field
		if (invalidTags.length > 0 || duplicateTags.length > 0) {
			// Keep problematic tags in input for correction
			setInputValue([...invalidTags, ...duplicateTags].join(", "));
		} else {
			// Clear input when all tags were processed successfully
			setInputValue("");
		}
	};

	const removeTag = (tagToRemove: string) => {
		onValueChange(value.filter((tag) => tag !== tagToRemove));
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			addTags();
		}
	};

	useEffect(() => {
		if (errors.length > 0) {
			const timer = setTimeout(() => {
				setErrors([]);
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [errors]);

	return (
		<div className="flex flex-col gap-[8px]">
			<ConfigurationFormFieldLabel label={label} tooltip={description} />
			<div className="flex items-start gap-3 rounded-lg bg-bg/80 p-1">
				<div className="flex min-h-[40px] flex-grow flex-wrap items-center gap-1 px-2">
					{value.map((tag) => (
						<div
							key={tag}
							className="mb-1 mr-2 flex items-center rounded-[4px] p-[1px] w-fit"
						>
							<div className="px-[8px] py-[2px] rounded-[3px] text-[12px] flex items-center gap-[4px] border bg-[rgba(var(--color-primary-rgb),0.05)] text-primary border-[rgba(var(--color-primary-rgb),0.1)]">
								<span className="max-w-[180px] truncate">{tag}</span>
								<button
									type="button"
									onClick={() => removeTag(tag)}
									className="ml-1 hover:opacity-70 *:size-[12px]"
								>
									<X className="size-[12px]" />
								</button>
							</div>
						</div>
					))}
					<input
						type="text"
						placeholder={value.length > 0 ? "Add more..." : placeholder}
						value={inputValue}
						onChange={(e) => {
							setErrors([]);
							setInputValue(e.target.value);
						}}
						onKeyDown={handleKeyDown}
						onBlur={addTags}
						className="min-w-[200px] flex-1 border-none bg-transparent px-1 py-1 text-[14px] text-text outline-none placeholder:text-text-muted"
					/>
				</div>
			</div>
			{errors.length > 0 && (
				<div className="flex flex-col gap-1">
					{errors.map((error) => (
						<div
							key={`${error.message}-${error.values?.join(",") ?? ""}`}
							className="text-[12px] text-error flex items-center gap-1"
						>
							<span>{error.message}</span>
							{error.values && error.values.length > 0 && (
								<span className="text-text-muted">
									({error.values.join(", ")})
								</span>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
