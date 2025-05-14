import { useMemo, useState } from "react";
import { Button } from "../../../../ui/button";
import { Input } from "../../../../ui/input";

const DOMAIN_VALIDATION_REGEX = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MAX_DOMAINS = 10;

// Domain list item component
interface DomainItemProps {
	domain: string;
	onRemove: () => void;
}

function DomainItem({ domain, onRemove }: DomainItemProps) {
	// Display domain name without the minus prefix for denylist items
	const displayName = domain.startsWith("-") ? domain.slice(1) : domain;

	return (
		<li className="domain-item flex items-center bg-white-900/10 rounded px-2 py-1 text-[13px]">
			{displayName}
			<Button
				variant="ghost"
				size="sm"
				className="domain-remove-button ml-1 px-1"
				onClick={onRemove}
			>
				×
			</Button>
		</li>
	);
}

// Domain list component for both allowlist and denylist
interface DomainListProps {
	type: "allow" | "deny";
	domains: string[];
	inputValue: string;
	setInputValue: (value: string) => void;
	onAdd: () => void;
	onRemove: (index: number) => void;
	isMaxReached: boolean;
	className?: string;
}

function DomainList({
	type,
	domains,
	inputValue,
	setInputValue,
	onAdd,
	onRemove,
	isMaxReached,
	className,
}: DomainListProps) {
	const isAllowList = type === "allow";
	const title = isAllowList ? "Allowlist" : "Denylist";
	const icon = isAllowList ? "✔" : "⛔";
	const titleColorClass = isAllowList ? "text-green-600" : "text-red-600";
	const placeholder = isAllowList
		? "Enter domain to include (e.g., example.com)"
		: "Enter domain to exclude (e.g., example.com)";

	return (
		<div className={`domain-list ${className || ""}`}>
			<span className={`${titleColorClass} text-[14px] font-semibold mt-2`}>
				{icon} {title} ({domains.length})
			</span>

			<div className="domain-input-container flex items-center gap-2 mt-1">
				<Input
					className="domain-input"
					placeholder={placeholder}
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") onAdd();
					}}
					maxLength={100}
					disabled={isMaxReached}
				/>
				<Button
					className="domain-add-button"
					variant="outline"
					size="sm"
					disabled={isMaxReached || !inputValue.trim()}
					onClick={onAdd}
				>
					Add
				</Button>
			</div>

			<ul className="domain-list-items flex flex-wrap gap-2 mt-2">
				{domains.map((domain, idx) => (
					<DomainItem
						key={domain}
						domain={domain}
						onRemove={() => onRemove(idx)}
					/>
				))}
			</ul>
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

	function removeAllowDomain(idx: number) {
		const newAllow = allowlist.filter((_, i) => i !== idx);
		updateDomainFilter(newAllow, denylist);
	}

	function removeDenyDomain(idx: number) {
		const newDeny = denylist.filter((_, i) => i !== idx);
		updateDomainFilter(allowlist, newDeny);
	}

	return (
		<div className="search-domain-filter flex flex-col gap-2 mt-8">
			<span className="filter-title font-bold text-[15px]">
				Search Domain Filter
			</span>

			<DomainList
				type="allow"
				domains={allowlist}
				inputValue={allowlistInput}
				setInputValue={setAllowlistInput}
				onAdd={addAllowDomain}
				onRemove={removeAllowDomain}
				isMaxReached={isMaxReached}
			/>

			<DomainList
				type="deny"
				domains={denylist}
				inputValue={denylistInput}
				setInputValue={setDenylistInput}
				onAdd={addDenyDomain}
				onRemove={removeDenyDomain}
				isMaxReached={isMaxReached}
				className="mt-4"
			/>

			{isMaxReached && (
				<p className="max-domains-warning text-red-700 text-[12px]">
					You can add up to {MAX_DOMAINS} domains only.
				</p>
			)}
		</div>
	);
}
