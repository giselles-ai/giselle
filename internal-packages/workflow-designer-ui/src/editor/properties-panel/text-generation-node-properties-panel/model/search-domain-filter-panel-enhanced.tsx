import { useMemo } from "react";
import { SearchDomainFilterEnhanced } from "../../../../ui/search-domain-filter-enhanced";

export function SearchDomainFilterPanelEnhanced({
	searchDomainFilter,
	onSearchDomainFilterChange,
}: {
	searchDomainFilter: string[];
	onSearchDomainFilterChange: (newFilter: string[]) => void;
}) {
	// Split existing filter array into include and exclude domains
	const allowlist = useMemo(
		() => searchDomainFilter.filter((d) => !d.startsWith("-")),
		[searchDomainFilter],
	);

	const denylist = useMemo(
		() =>
			searchDomainFilter
				.filter((d) => d.startsWith("-"))
				.map((d) => d.slice(1)),
		[searchDomainFilter],
	);

	// Handler for filter changes
	const handleFilterChange = (include: string[], exclude: string[]) => {
		// Add "-" prefix to exclude items to match existing format
		const formattedExclude = exclude.map((domain) => `-${domain}`);
		// Merge include and exclude to match existing format
		const merged = [...include, ...formattedExclude];

		onSearchDomainFilterChange(merged);
	};

	return (
		<div className="search-domain-filter-panel-enhanced">
			<SearchDomainFilterEnhanced
				onFilterChange={handleFilterChange}
				defaultIncludeDomains={allowlist}
				defaultExcludeDomains={denylist}
				includePlaceholder="Enter domain to include (e.g., example.com)"
				excludePlaceholder="Enter domain to exclude"
			/>
		</div>
	);
}
