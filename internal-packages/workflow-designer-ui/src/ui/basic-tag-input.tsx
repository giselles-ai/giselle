import { XIcon } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";

// Maximum number of domains allowed
const MAX_DOMAINS = 10;

// Basic tag input component that allows managing tags externally
type BasicTagInputProps = {
	initialTags?: string[];
	onTagsChange?: (tags: string[]) => void;
	label?: string;
	placeholder?: string;
	validateInput?: (input: string) => { isValid: boolean; message?: string };
	emptyStateText?: string;
};

export function BasicTagInput({
	initialTags = [],
	onTagsChange,
	label = "Tags",
	placeholder = "Type and press Enter",
	validateInput,
	emptyStateText = "No tags added yet",
}: BasicTagInputProps) {
	// Local state for managing tags
	const [tags, setTags] = useState<string[]>(initialTags);
	const [inputValue, setInputValue] = useState("");
	const [isFocused, setIsFocused] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);

	// Create stable tag ids for keys
	const tagIds = useMemo(() => {
		return tags.map((tag) => ({
			id: `tag-${Math.random().toString(36).substr(2, 9)}`,
			value: tag,
		}));
	}, [tags]);

	// Check if maximum domains limit reached
	const isMaxReached = tags.length >= MAX_DOMAINS;

	// Generate ID for input field
	const inputId = `tag-input-${label.toLowerCase().replace(/\s+/g, "-")}`;

	// Update local state when initialTags changes
	useEffect(() => {
		setTags(initialTags);
	}, [initialTags]);

	// Tag addition process
	const addTag = () => {
		if (inputValue.trim() !== "") {
			// Check if maximum limit reached
			if (isMaxReached) return;

			// Validation check
			if (validateInput) {
				const validationResult = validateInput(inputValue.trim());
				if (!validationResult.isValid) {
					setValidationError(validationResult.message || "Invalid input");
					return;
				}
			}

			const newTags = [...tags, inputValue.trim()];
			setTags(newTags);
			setInputValue("");
			setValidationError(null);

			// Notify parent component of the change
			if (onTagsChange) {
				onTagsChange(newTags);
			}
		}
	};

	// Clear validation error when input value changes
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
		if (validationError) {
			setValidationError(null);
		}
	};

	// Tag removal process
	const removeTag = (index: number) => {
		const newTags = tags.filter((_, i) => i !== index);
		setTags(newTags);

		// Notify parent component of the change
		if (onTagsChange) {
			onTagsChange(newTags);
		}
	};

	// Common Geist font style
	const geistFontStyle = {
		fontFamily: "var(--font-geist), system-ui, sans-serif",
	};

	return (
		<div className="w-full mb-5 flex" style={geistFontStyle}>
			{/* Left side: Label */}
			<div className="w-1/4">
				<label
					htmlFor={inputId}
					className="block text-sm font-medium"
					style={geistFontStyle}
				>
					{label}
				</label>
			</div>

			{/* Right side: Tags and input field */}
			<div className="w-3/4 flex flex-col">
				{/* Area to display tags */}
				<div className="flex flex-wrap gap-1 mb-3">
					{tagIds.map((tagItem, index) => (
						<div
							key={tagItem.id}
							style={{
								display: "flex",
								alignItems: "center",
								backgroundColor: "var(--white-850, #F5F5F5)",
								padding: "2px 6px",
								borderRadius: "4px",
								border: "none",
								color: "var(--black-850, #0D1424)",
								marginRight: "4px",
								marginBottom: "4px",
								fontFamily: "var(--font-geist), system-ui, sans-serif",
							}}
						>
							<span className="mr-1 text-sm">{tagItem.value}</span>
							<button
								type="button"
								onClick={() => removeTag(index)}
								style={{
									padding: "0 0 0 2px",
									color: "var(--black-400, #505D7B)",
									backgroundColor: "transparent",
									border: "none",
									cursor: "pointer",
									fontFamily: "var(--font-geist), system-ui, sans-serif",
								}}
							>
								<XIcon className="h-3 w-3" />
							</button>
						</div>
					))}
					{tags.length === 0 && (
						<span
							className="text-gray-500 italic text-sm"
							style={geistFontStyle}
						>
							{emptyStateText}
						</span>
					)}
				</div>

				{/* Maximum domains warning */}
				{isMaxReached && (
					<div style={{ marginBottom: "8px" }}>
						<p
							style={{
								color: "var(--color-error-900, #FF627E)",
								fontSize: "12px",
								fontFamily: "var(--font-geist), system-ui, sans-serif",
							}}
						>
							You can add up to {MAX_DOMAINS} domains only.
						</p>
					</div>
				)}

				{/* Input area */}
				<div
					style={{
						display: "flex",
						padding: "6px 12px",
						flexDirection: "row",
						justifyContent: "space-between",
						alignItems: "center",
						flex: "1 0 0",
						alignSelf: "stretch",
						borderRadius: "8px",
						border: validationError
							? "0.5px solid var(--color-error-900, #FF627E)"
							: "0.5px solid var(--white-900, #F7F9FD)",
					}}
				>
					<input
						id={inputId}
						type="text"
						value={inputValue}
						onChange={handleInputChange}
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								addTag();
							}
						}}
						placeholder={placeholder}
						style={{
							color:
								inputValue || isFocused
									? "var(--white-900, #F7F9FD)"
									: "var(--black-400, #505D7B)",
							fontFamily: "var(--font-geist), system-ui, sans-serif",
							fontSize: "14px",
							fontStyle: "normal",
							fontWeight: 500,
							lineHeight: "170%",
							width: "100%",
							flex: 1,
							backgroundColor: "transparent",
							border: "none",
							outline: "none",
							padding: 0,
						}}
						disabled={isMaxReached}
					/>
					<button
						type="button"
						onClick={addTag}
						disabled={!inputValue.trim() || isMaxReached}
						style={{
							marginLeft: "8px",
							padding: "4px 12px",
							backgroundColor: "#F7F9FD",
							color: "#1E293B",
							borderRadius: "4px",
							border: "none",
							fontSize: "14px",
							fontWeight: 500,
							fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
							cursor:
								inputValue.trim() === "" || isMaxReached
									? "not-allowed"
									: "pointer",
							opacity: inputValue.trim() === "" || isMaxReached ? 0.5 : 1,
						}}
					>
						Add
					</button>
				</div>

				{/* Validation error message */}
				{validationError && (
					<div
						style={{
							color: "var(--color-error-900, #FF627E)",
							fontSize: "12px",
							marginTop: "4px",
							fontFamily: "var(--font-geist), system-ui, sans-serif",
						}}
					>
						{validationError}
					</div>
				)}
			</div>
		</div>
	);
}
