import { GlassSurfaceLayers } from "@giselle-internal/ui/glass-surface";
import {
	type LanguageModelId,
	languageModels as registryLanguageModels,
} from "@giselles-ai/language-model-registry";
import { ToggleGroup } from "radix-ui";
import { useMemo, useState } from "react";
import { useShallow } from "zustand/shallow";
import { LanguageModelItemButton } from "./language-model-item-button";
import { useLanguageModelV2ToggleGroupStore } from "./store";

const recommendedLanguageModelIds: LanguageModelId[] = [
	"openai/gpt-5.1-thinking",
	"google/gemini-2.5-pro",
	"anthropic/claude-sonnet-4-5",
];

export function LanguageModelV2ToggleGroup() {
	const [query, setQuery] = useState("");
	const languageModels = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();
		if (normalizedQuery === "") {
			return registryLanguageModels;
		}
		return registryLanguageModels.filter((model) => {
			const matchesName = model.name.toLowerCase().includes(normalizedQuery);
			const matchesId = model.id.toLowerCase().includes(normalizedQuery);
			const matchesProvider = model.provider
				.toLowerCase()
				.includes(normalizedQuery);
			return matchesName || matchesId || matchesProvider;
		});
	}, [query]);
	const recommendedLanguageModels = useMemo(
		() =>
			languageModels.filter((model) =>
				recommendedLanguageModelIds.includes(model.id),
			),
		[languageModels],
	);
	const { setHover } = useLanguageModelV2ToggleGroupStore(
		useShallow((s) => ({ setHover: s.setHover, clearHover: s.clearHover })),
	);

	return (
		<ToggleGroup.Root
			type="single"
			onValueChange={(value) => console.log(value)}
		>
			<div
				className="absolute inset-0 -z-10 rounded-[8px] pointer-events-none"
				style={{
					backgroundColor:
						"color-mix(in srgb, var(--color-background, #00020b) 50%, transparent)",
				}}
			/>
			<GlassSurfaceLayers
				radiusClass="rounded-[8px]"
				borderStyle="solid"
				withBaseFill={false}
				blurClass="backdrop-blur-lg"
				zIndexClass="z-0"
			/>
			<div className="relative flex flex-col gap-[8px] max-h-[280px] overflow-y-hidden">
				{/* Search box */}
				<div className="flex h-[28px] p-[8px] items-center gap-[11px] self-stretch rounded-[8px] bg-[rgba(222,233,242,0.20)] mx-[4px] mb-[4px]">
					<div className="text-text-muted">
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							role="img"
							aria-labelledby="searchIconTitle"
						>
							<title id="searchIconTitle">Search Icon</title>
							<path
								d="M21 21L15.5 15.5M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</div>
					<input
						type="text"
						placeholder="Search LLM Model..."
						className="w-full bg-transparent border-none text-inverse text-[12px] placeholder:text-link-muted focus:outline-none"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
				</div>

				<div className="mt-[0px] mx-[4px] overflow-y-auto">
					{recommendedLanguageModels.length > 0 && (
						<>
							<p className="text-[#505D7B] text-[12px] font-medium leading-[170%] mb-[4px]">
								Recommended models
							</p>
							{/* Display recommended models */}
							<div className="flex flex-col mb-[12px]">
								{recommendedLanguageModels.map((languageModel) => (
									<ToggleGroup.Item
										key={languageModel.id}
										asChild
										value={languageModel.id}
										onMouseEnter={() => {
											setHover(languageModel.id);
										}}
									>
										<LanguageModelItemButton
											modelId={languageModel.id}
											userTier="free"
										/>
									</ToggleGroup.Item>
								))}
							</div>

							{/* Divider */}
							<div className="flex my-[12px] mx-auto w-[90%] py-0 flex-col items-center border-b border-[#505D7B]/20" />
						</>
					)}

					{/* Flat list of models with filtering applied */}
					<div className="flex flex-col pr-[4px]">
						{languageModels.length > 0
							? languageModels.map((languageModel) => (
									<ToggleGroup.Item
										key={languageModel.id}
										asChild
										value={languageModel.id}
										onMouseEnter={() => {
											setHover(languageModel.id);
										}}
									>
										<LanguageModelItemButton
											modelId={languageModel.id}
											userTier="free"
										/>
									</ToggleGroup.Item>
								))
							: languageModels.length === 0 && (
									<p className="text-[#505D7B] text-[12px] font-medium leading-[170%] p-[8px] text-center">
										No matching models found
									</p>
								)}
					</div>
				</div>
			</div>
		</ToggleGroup.Root>
	);
}
