import { useEffect, useState } from "react";
import { BasicTagInput } from "../../../../ui/basic-tag-input";

const MAX_DOMAINS = 10;

// Function to check if a domain name is valid
const isValidDomain = (domain: string): boolean => {
	// Simple domain name validation
	// Basic domain name patterns: example.com, sub.example.co.jp, etc.
	const domainRegex =
		/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
	return domainRegex.test(domain);
};

export function SimpleDomainFilter({
	searchDomainFilter,
	onSearchDomainFilterChange,
}: {
	searchDomainFilter: string[];
	onSearchDomainFilterChange: (newFilter: string[]) => void;
}) {
	// Create local state
	const [allowList, setAllowList] = useState<string[]>([]);
	const [denyList, setDenyList] = useState<string[]>([]);
	// Add internal update flag
	const [isInternalUpdate, setIsInternalUpdate] = useState(false);

	// Calculate total domains and check if max is reached
	const totalDomains = allowList.length + denyList.length;
	const isMaxReached = totalDomains >= MAX_DOMAINS;

	// Set initial data
	useEffect(() => {
		// Skip if internal update
		if (isInternalUpdate) {
			setIsInternalUpdate(false);
			return;
		}

		const allow = searchDomainFilter.filter((d) => !d.startsWith("-"));
		const deny = searchDomainFilter
			.filter((d) => d.startsWith("-"))
			.map((d) => d.slice(1));

		setAllowList(allow);
		setDenyList(deny);
	}, [searchDomainFilter, isInternalUpdate]);

	// Handle Allow list changes
	const handleAllowListChange = (newTags: string[]) => {
		// Check if adding would exceed limit
		const totalAfterChange = newTags.length + denyList.length;
		if (totalAfterChange > MAX_DOMAINS) {
			return; // Don't allow adding beyond limit
		}
		setAllowList(newTags);
		updateParent(newTags, denyList);
	};

	// Handle Deny list changes
	const handleDenyListChange = (newTags: string[]) => {
		// Check if adding would exceed limit
		const totalAfterChange = allowList.length + newTags.length;
		if (totalAfterChange > MAX_DOMAINS) {
			return; // Don't allow adding beyond limit
		}
		setDenyList(newTags);
		updateParent(allowList, newTags);
	};

	// Function to notify parent component
	const updateParent = (allow: string[], deny: string[]) => {
		const formattedDeny = deny.map((d) => `-${d}`);
		const combined = [...allow, ...formattedDeny];

		// Set internal update flag
		setIsInternalUpdate(true);
		onSearchDomainFilterChange(combined);
	};

	// Domain name validation function
	const validateDomainName = (input: string) => {
		if (!isValidDomain(input)) {
			return {
				isValid: false,
				message: `'${input}' is not a valid domain name (e.g., example.com)`,
			};
		}

		return { isValid: true };
	};

	return (
		<div>
			<h2
				style={{
					color: "white",
					marginBottom: "12px",
				}}
			>
				Search Domain Filter
			</h2>

			{/* Display domain count */}
			<div className="mb-4 text-[13px] text-gray-400">
				Total domains: {totalDomains}/{MAX_DOMAINS}
			</div>

			<div className="space-y-4">
				{/* Allow list */}
				<BasicTagInput
					initialTags={allowList}
					onTagsChange={handleAllowListChange}
					label="Allow List"
					placeholder="Enter domain to include (e.g., example.com)"
					validateInput={validateDomainName}
					emptyStateText="No domains added yet"
				/>

				{/* Deny list */}
				<BasicTagInput
					initialTags={denyList}
					onTagsChange={handleDenyListChange}
					label="Deny List"
					placeholder="Enter domain to exclude"
					validateInput={validateDomainName}
					emptyStateText="No domains added yet"
				/>
			</div>
		</div>
	);
}
