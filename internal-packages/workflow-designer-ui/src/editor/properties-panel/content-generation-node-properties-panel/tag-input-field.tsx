import { Input } from "@giselle-internal/ui/input";
import { X } from "lucide-react";
import { useState } from "react";
import { validateUrl } from "../../lib/validate-url";
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

	const extractDomainFromUrl = (input: string): string | null => {
		// Try to parse as URL
		const url = validateUrl(input);
		if (url) {
			return url.hostname;
		}
		return null;
	};

	const addTags = (
		textToProcess?: string,
		options?: { shouldUpdateInput?: boolean },
	) => {
		const text = textToProcess ?? inputValue;
		const shouldUpdateInput = options?.shouldUpdateInput ?? true;
		if (!text.trim()) return;

		// Parse tags
		const tags = text
			.trim()
			.split(/[,;\s]+/)
			.map((tag) => tag.trim())
			.filter(Boolean);

		// Convert URLs to domains before processing
		const processedTags = tags.map((tag) => {
			const domain = extractDomainFromUrl(tag);
			return domain ?? tag;
		});

		// Remove duplicates within the input batch
		const uniqueTags = [...new Set(processedTags)];

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

		// Update input field only if shouldUpdateInput is true
		if (shouldUpdateInput) {
			if (invalidTags.length > 0 || duplicateTags.length > 0) {
				// Keep problematic tags in input for correction
				setInputValue([...invalidTags, ...duplicateTags].join(", "));
			} else {
				// Clear input when all tags were processed successfully
				setInputValue("");
			}
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
		// TabキーはonBlurで処理される
	};

	const handleBlur = () => {
		addTags();
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setErrors([]);

		if (newValue.includes(",")) {
			const commaIndex = newValue.indexOf(",");
			const tagToAdd = newValue.slice(0, commaIndex).trim();
			const remainingText = newValue.slice(commaIndex + 1);

			if (tagToAdd) {
				addTags(tagToAdd, { shouldUpdateInput: false });
				setInputValue(remainingText);
				return;
			}
		}

		setInputValue(newValue);
	};

	return (
		<div className="flex flex-col gap-[8px]">
			<ConfigurationFormFieldLabel label={label} tooltip={description} />
			<div className="flex flex-col gap-2 rounded-lg bg-bg/80 p-1 pl-0">
				{value.length > 0 && (
					<div className="flex flex-wrap items-center gap-1">
						{value.map((tag) => (
							<div key={tag} className="flex items-center rounded-[4px] w-fit">
								<div className="h-[24px] px-[8px] py-[2px] rounded-[3px] text-[12px] leading-[1] flex items-center gap-[4px] border bg-[rgba(var(--color-primary-rgb),0.05)] text-primary border-[rgba(var(--color-primary-rgb),0.1)]">
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
					</div>
				)}
				<Input
					type="text"
					placeholder={value.length > 0 ? "Add more..." : placeholder}
					value={inputValue}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					onBlur={handleBlur}
					className="w-full h-[24px] text-[12px] rounded-[3px] leading-[1]"
				/>
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
