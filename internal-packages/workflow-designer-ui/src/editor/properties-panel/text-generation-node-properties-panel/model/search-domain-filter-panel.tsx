import { useMemo, useState } from "react";
import { Button } from "../../../../ui/button";
import { Input } from "../../../../ui/input";

const DOMAIN_VALIDATION_REGEX = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MAX_DOMAINS = 10;

// Simple domain input component
function SimpleDomainInput({
	label,
	inputValue,
	setInputValue,
	onAdd,
	placeholder,
}: {
	label: string;
	inputValue: string;
	setInputValue: (value: string) => void;
	onAdd: () => void;
	placeholder: string;
}) {
	return (
		<div className="flex w-full mb-4">
			<div className="w-[150px] flex items-center">
				<span className="text-[14px] text-white pl-2">{label}</span>
			</div>
			<div className="flex-1 flex items-center">
				<Input
					className="w-full h-10 bg-transparent border-[0.5px] border-white-900 rounded-md text-[14px] text-gray-300 px-3 py-2 placeholder:text-gray-500"
					placeholder={placeholder}
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							onAdd();
						}
					}}
					maxLength={100}
				/>
				<Button
					className="ml-2 px-2 py-1 text-sm text-gray-300 opacity-50 hover:opacity-100"
					variant="ghost"
					onClick={onAdd}
					disabled={!inputValue.trim()}
				>
					Add
				</Button>
			</div>
		</div>
	);
}

export function SearchDomainFilterPanel({
	searchDomainFilter,
	onSearchDomainFilterChange,
}: {
	searchDomainFilter: string[];
	onSearchDomainFilterChange: (newFilter: string[]) => void;
}) {
	const [allowlistInput, setAllowlistInput] = useState("");
	const [denylistInput, setDenylistInput] = useState("");

	const allowlist = useMemo(
		() => searchDomainFilter.filter((d) => !d.startsWith("-")),
		[searchDomainFilter],
	);

	const denylist = useMemo(
		() => searchDomainFilter.filter((d) => d.startsWith("-")),
		[searchDomainFilter],
	);

	const totalDomains = allowlist.length + denylist.length;
	const isMaxReached = totalDomains >= MAX_DOMAINS;
	const getMaxReachedMessage = () =>
		`You can add up to ${MAX_DOMAINS} domains only (combined Allow and Deny lists).`;

	function updateDomainFilter(newAllow: string[], newDeny: string[]) {
		const merged = [...newAllow, ...newDeny];
		onSearchDomainFilterChange(merged);
	}

	function addAllowDomain() {
		const value = allowlistInput.trim();
		if (!value) return;
		if (!DOMAIN_VALIDATION_REGEX.test(value)) return;
		if (isMaxReached) return;
		if (allowlist.includes(value) || denylist.some((d) => d.slice(1) === value))
			return;

		updateDomainFilter([...allowlist, value], denylist);
		setAllowlistInput("");
	}

	function addDenyDomain() {
		const value = denylistInput.trim();
		if (!value) return;
		if (!DOMAIN_VALIDATION_REGEX.test(value)) return;
		if (isMaxReached) return;
		if (denylist.includes(`-${value}`) || allowlist.includes(value)) return;

		updateDomainFilter(allowlist, [...denylist, `-${value}`]);
		setDenylistInput("");
	}

	return (
		<div className="search-domain-filter mt-8">
			<div className="mb-4 text-[15px] font-medium text-white">
				Search Domain Filter
			</div>

			{/* Display domain count */}
			<div className="mb-4 text-[13px] text-gray-400">
				Total domains: {totalDomains}/{MAX_DOMAINS} (combined Allow and Deny
				lists)
			</div>

			{isMaxReached && (
				<div className="mb-4 text-red-700 text-[12px]">
					{getMaxReachedMessage()}
				</div>
			)}

			<SimpleDomainInput
				label="Allow List"
				inputValue={allowlistInput}
				setInputValue={setAllowlistInput}
				onAdd={addAllowDomain}
				placeholder="Enter domain to include(e.g.,example.com)"
			/>

			{allowlist.length > 0 && (
				<div className="ml-[150px] mb-4 text-[13px] text-gray-400">
					Added: {allowlist.join(", ")}
				</div>
			)}

			<SimpleDomainInput
				label="Deny List"
				inputValue={denylistInput}
				setInputValue={setDenylistInput}
				onAdd={addDenyDomain}
				placeholder="Enter domain to exclude(e.g.,example.com)"
			/>

			{denylist.length > 0 && (
				<div className="ml-[150px] mb-4 text-[13px] text-gray-400">
					Added: {denylist.map((d) => d.slice(1)).join(", ")}
				</div>
			)}
		</div>
	);
}
