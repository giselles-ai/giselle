import { useEffect, useState } from "react";
import { type DomainTag, DomainTagInput } from "./domain-tag-input";

const MAX_DOMAINS = 10;

export type SearchDomainFilterEnhancedProps = {
	onFilterChange?: (include: string[], exclude: string[]) => void;
	className?: string;
	includePlaceholder?: string;
	excludePlaceholder?: string;
	defaultIncludeDomains?: string[];
	defaultExcludeDomains?: string[];
};

export function SearchDomainFilterEnhanced({
	onFilterChange,
	className = "",
	includePlaceholder = "Enter text to include",
	excludePlaceholder = "Enter text to exclude",
	defaultIncludeDomains = [],
	defaultExcludeDomains = [],
}: SearchDomainFilterEnhancedProps) {
	// Create initial tags with unique IDs
	const createInitialTags = (domains: string[]): DomainTag[] => {
		return domains.map((domain, index) => ({
			id: `initial-${index}-${domain}-${Date.now()}`,
			domain: domain,
		}));
	};

	// Initialize state with default values
	const [includeDomains, setIncludeDomains] = useState<DomainTag[]>(() => {
		return createInitialTags(defaultIncludeDomains);
	});

	const [excludeDomains, setExcludeDomains] = useState<DomainTag[]>(() => {
		return createInitialTags(defaultExcludeDomains);
	});

	// Calculate total domains and check if max is reached
	const totalDomains = includeDomains.length + excludeDomains.length;
	const isMaxReached = totalDomains >= MAX_DOMAINS;

	// Effect to notify parent of changes
	useEffect(() => {
		if (onFilterChange) {
			const includeValues = includeDomains.map((tag) => tag.domain);
			const excludeValues = excludeDomains.map((tag) => tag.domain);
			onFilterChange(includeValues, excludeValues);
		}
	}, [includeDomains, excludeDomains, onFilterChange]);

	// Add include domain
	const handleAddIncludeDomain = (domain: string) => {
		// Check if max limit is reached
		if (isMaxReached) {
			return;
		}
		// Check for duplicates
		if (includeDomains.some((d) => d.domain === domain)) {
			return;
		}
		// Check if exists in exclude list
		if (excludeDomains.some((d) => d.domain === domain)) {
			return;
		}

		const newDomain: DomainTag = {
			id: `include-${Date.now()}`,
			domain,
		};

		setIncludeDomains((prevDomains) => {
			return [...prevDomains, newDomain];
		});
	};

	// Remove include domain
	const handleRemoveIncludeDomain = (id: string) => {
		setIncludeDomains((prevDomains) => {
			return prevDomains.filter((d) => d.id !== id);
		});
	};

	// Add exclude domain
	const handleAddExcludeDomain = (domain: string) => {
		// Check if max limit is reached
		if (isMaxReached) {
			return;
		}
		// Check for duplicates
		if (excludeDomains.some((d) => d.domain === domain)) {
			return;
		}
		// Check if exists in include list
		if (includeDomains.some((d) => d.domain === domain)) {
			return;
		}

		const newDomain: DomainTag = {
			id: `exclude-${Date.now()}`,
			domain,
		};

		setExcludeDomains((prevDomains) => {
			return [...prevDomains, newDomain];
		});
	};

	// Remove exclude domain
	const handleRemoveExcludeDomain = (id: string) => {
		setExcludeDomains((prevDomains) => {
			return prevDomains.filter((d) => d.id !== id);
		});
	};

	return (
		<div className={`search-domain-filter mt-8 ${className}`}>
			<div className="mb-4 text-[15px] font-medium text-white">
				Search Domain Filter
			</div>

			{/* Display domain count */}
			<div className="mb-4 text-[13px] text-gray-400">
				Total domains: {totalDomains}/{MAX_DOMAINS}
			</div>

			{/* Include domain input and tags */}
			<DomainTagInput
				domains={includeDomains}
				onAddDomain={handleAddIncludeDomain}
				onRemoveDomain={handleRemoveIncludeDomain}
				placeholder={includePlaceholder}
				label="Allow List"
			/>

			{/* Exclude domain input and tags */}
			<DomainTagInput
				domains={excludeDomains}
				onAddDomain={handleAddExcludeDomain}
				onRemoveDomain={handleRemoveExcludeDomain}
				placeholder={excludePlaceholder}
				label="Deny List"
			/>
		</div>
	);
}
