import { useEffect, useState } from "react";
import { type Tag, TagInput } from "./tag-input";

export type SearchDomainFilterProps = {
	onFilterChange?: (include: string[], exclude: string[]) => void;
	className?: string;
	includePlaceholder?: string;
	excludePlaceholder?: string;
	defaultIncludeDomains?: string[];
	defaultExcludeDomains?: string[];
};

export function SearchDomainFilter({
	onFilterChange,
	className = "",
	includePlaceholder = "Enter domain to include (e.g., example.com)",
	excludePlaceholder = "Enter domain to exclude",
	defaultIncludeDomains = [],
	defaultExcludeDomains = [],
}: SearchDomainFilterProps) {
	// 初期タグを生成
	const createInitialTags = (domains: string[]): Tag[] => {
		return domains.map((domain) => ({
			id: domain,
			label: domain,
		}));
	};

	const [includeTags, setIncludeTags] = useState<Tag[]>(
		createInitialTags(defaultIncludeDomains),
	);
	const [excludeTags, setExcludeTags] = useState<Tag[]>(
		createInitialTags(defaultExcludeDomains),
	);

	// 親コンポーネントに変更を通知
	useEffect(() => {
		if (onFilterChange) {
			const includeValues = includeTags.map((tag) => tag.label);
			const excludeValues = excludeTags.map((tag) => tag.label);
			onFilterChange(includeValues, excludeValues);
		}
	}, [includeTags, excludeTags, onFilterChange]);

	// includeタグの追加
	const handleAddIncludeTag = (value: string) => {
		// 重複チェック
		if (includeTags.some((tag) => tag.label === value)) {
			return;
		}

		const newTag: Tag = {
			id: `include-${Date.now()}`,
			label: value,
		};
		setIncludeTags([...includeTags, newTag]);
	};

	// includeタグの削除
	const handleRemoveIncludeTag = (id: string) => {
		setIncludeTags(includeTags.filter((tag) => tag.id !== id));
	};

	// excludeタグの追加
	const handleAddExcludeTag = (value: string) => {
		// 重複チェック
		if (excludeTags.some((tag) => tag.label === value)) {
			return;
		}

		const newTag: Tag = {
			id: `exclude-${Date.now()}`,
			label: value,
		};
		setExcludeTags([...excludeTags, newTag]);
	};

	// excludeタグの削除
	const handleRemoveExcludeTag = (id: string) => {
		setExcludeTags(excludeTags.filter((tag) => tag.id !== id));
	};

	return (
		<div className={`flex flex-col gap-4 ${className}`}>
			{/* Include フィルター */}
			<TagInput
				label="Include Domains"
				tags={includeTags}
				onAddTag={handleAddIncludeTag}
				onRemoveTag={handleRemoveIncludeTag}
				placeholder={includePlaceholder}
				buttonLabel="Add"
				className="text-white"
			/>

			{/* Exclude フィルター */}
			<TagInput
				label="Exclude Domains"
				tags={excludeTags}
				onAddTag={handleAddExcludeTag}
				onRemoveTag={handleRemoveExcludeTag}
				placeholder={excludePlaceholder}
				buttonLabel="Add"
				className="text-white"
			/>
		</div>
	);
}

// 使用例
export function SearchDomainFilterExample() {
	const handleFilterChange = (include: string[], exclude: string[]) => {
		console.log("Include domains:", include);
		console.log("Exclude domains:", exclude);
	};

	return (
		<div className="p-4 bg-gray-900 rounded">
			<SearchDomainFilter
				onFilterChange={handleFilterChange}
				defaultIncludeDomains={["example.com"]}
			/>
		</div>
	);
}
