import { XIcon } from "lucide-react";
import React, { type KeyboardEvent, useEffect, useState } from "react";
import { Button } from "./button";
import { Input } from "./input";

export type DomainTag = {
	id: string;
	domain: string;
};

// Maximum number of domains allowed
const MAX_DOMAINS = 10;

type DomainTagInputProps = {
	domains: DomainTag[];
	onAddDomain: (domain: string) => void;
	onRemoveDomain: (id: string) => void;
	placeholder?: string;
	className?: string;
	label?: string;
};

export function DomainTagInput({
	domains,
	onAddDomain,
	onRemoveDomain,
	placeholder = "Enter text to add",
	className = "",
	label,
}: DomainTagInputProps) {
	const [inputValue, setInputValue] = useState("");

	// Check if maximum domains limit reached
	const isMaxReached = domains.length >= MAX_DOMAINS;

	const handleAddDomain = () => {
		const value = inputValue.trim();
		if (!value) return;

		// Prevent adding if max limit reached
		if (isMaxReached) return;

		onAddDomain(value);
		setInputValue("");
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleAddDomain();
		}
	};

	return (
		<div className="w-full mb-6">
			{/* Label */}
			<div className="flex mb-2">
				<div className="w-[150px]">
					<span className="text-[14px] text-white pl-2">{label}</span>
				</div>
			</div>

			{/* Tag area - above the input field */}
			<div className="flex flex-wrap ml-[150px] mb-4">
				{domains.map((domain) => (
					<div
						key={domain.id}
						className="flex items-center bg-gray-800 text-white rounded-sm px-2 py-1 mr-2 mb-2"
					>
						<span className="mr-1 text-sm">{domain.domain}</span>
						<button
							type="button"
							onClick={() => onRemoveDomain(domain.id)}
							className="text-gray-300 hover:text-white"
						>
							<XIcon className="h-3 w-3" />
						</button>
					</div>
				))}
			</div>

			{/* Maximum domains warning */}
			{isMaxReached && (
				<div className="ml-[150px] mb-4">
					<p className="max-domains-warning text-red-700 text-[12px]">
						You can add up to {MAX_DOMAINS} domains only.
					</p>
				</div>
			)}

			{/* Input area - placed below the tags */}
			<div className="flex items-center">
				<div className="w-[150px]">
					{/* Space for alignment with the label */}
				</div>
				<div className="flex-1 flex items-center">
					<Input
						className="w-full h-10 bg-transparent border-[0.5px] border-white-900 rounded-md text-[14px] text-gray-300 px-3 py-2 placeholder:text-gray-500"
						placeholder={placeholder}
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={handleKeyDown}
						maxLength={100}
						disabled={isMaxReached}
					/>
					<Button
						className="ml-2 px-2 py-1 text-sm text-gray-300 opacity-50 hover:opacity-100"
						variant="ghost"
						onClick={handleAddDomain}
						disabled={!inputValue.trim() || isMaxReached}
					>
						Add
					</Button>
				</div>
			</div>
		</div>
	);
}
