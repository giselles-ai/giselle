"use client";

import { GlassSurfaceLayers } from "@giselle-internal/ui/glass-surface";
import {
	isLanguageModelId,
	type LanguageModel,
	type LanguageModelId,
	type LanguageModelProvider,
	type LanguageModelTier,
	languageModels as registryLanguageModels,
} from "@giselles-ai/language-model-registry";
import clsx from "clsx/lite";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useMemo, useState } from "react";

const freeRecommendedLanguageModelIds: LanguageModelId[] = [
	"openai/gpt-5-nano",
	"anthropic/claude-haiku-4-5",
	"google/gemini-2.5-flash-lite",
];

const proRecommendedLanguageModelIds: LanguageModelId[] = [
	"openai/gpt-5.1-thinking",
	"google/gemini-3-pro-preview",
	"anthropic/claude-opus-4.5",
];

export function ModelPickerV2({
	value,
	onChange,
	userTier,
}: {
	value: LanguageModelId;
	onChange?: (modelId: LanguageModelId) => void;
	userTier: LanguageModelTier | undefined;
}) {
	const [open, setOpen] = useState(false);
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
	const recommendedLanguageModelIds =
		userTier === undefined
			? []
			: userTier === "free"
				? freeRecommendedLanguageModelIds
				: proRecommendedLanguageModelIds;
	const recommendedLanguageModels = useMemo(
		() =>
			languageModels.filter((model) =>
				recommendedLanguageModelIds.includes(model.id),
			),
		[languageModels, recommendedLanguageModelIds],
	);

	const languageModelGroupByProvider = useMemo(() => {
		const grouped = languageModels.reduce(
			(acc, model) => {
				const provider = model.provider;
				if (!acc[provider]) {
					acc[provider] = [];
				}
				acc[provider].push(model);
				return acc;
			},
			{} as Record<LanguageModelProvider, LanguageModel[]>,
		);
		return Object.entries(grouped).map(([provider, models]) => ({
			provider: provider as LanguageModelProvider,
			models,
		}));
	}, [languageModels]);

	return (
		<PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
			<PopoverPrimitive.Trigger asChild>
				<button
					type="button"
					className={clsx(
						"flex-1 flex justify-between items-center rounded-[8px] h-9 text-left text-[14px] shrink-0",
						"outline-none focus:outline-none focus-visible:outline-none focus:ring-0",
						"bg-transparent border border-[color-mix(in_srgb,var(--color-text-inverse,#fff)_20%,transparent)] transition-colors hover:bg-white/5",
						"px-[8px]",
						"data-[placeholder]:text-text-muted",
					)}
				>
					<span className="min-w-0 text-ellipsis overflow-hidden whitespace-nowrap">
						{value}
					</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="size-[13px] shrink-0 text-text ml-2"
						role="img"
						aria-label="Open"
					>
						<path d="m6 9 6 6 6-6" />
					</svg>
				</button>
			</PopoverPrimitive.Trigger>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Content
					sideOffset={6}
					align="end"
					className={clsx(
						"relative rounded-[8px] px-[8px] py-[8px] text-inverse overflow-hidden z-50",
					)}
				>
					<GlassSurfaceLayers
						radiusClass="rounded-[8px]"
						borderStyle="solid"
						withTopHighlight
						withBaseFill
					/>
					<div className="relative flex flex-col gap-[8px] max-h-[320px] overflow-y-auto">
						<div className="flex h-[28px] p-[8px] items-center gap-[8px] self-stretch rounded-[8px] bg-white/10 mx-[4px] mb-[4px]">
							<div className="text-text-muted">
								<svg
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									role="img"
									aria-label="Search"
								>
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
								placeholder="Search model..."
								className="w-full bg-transparent border-none text-inverse text-[12px] placeholder:text-link-muted focus:outline-none"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
							/>
						</div>

						<div className="mt-[0px] mx-[4px] pr-[4px]">
							<div className="flex flex-col gap-[6px] max-h-[220px] overflow-y-auto">
								{recommendedLanguageModels.length > 0 && (
									<div className="flex flex-col gap-[4px]">
										<div className="text-[11px] text-link-muted px-[4px]">
											Recommended
										</div>
										{recommendedLanguageModels.map((model) => (
											<button
												key={model.id}
												type="button"
												className={clsx(
													"flex gap-[12px] items-center p-[4px] rounded-[4px] text-left",
													"hover:bg-white/5 focus:bg-white/5 cursor-pointer",
												)}
												onClick={() => {
													if (isLanguageModelId(model.id)) {
														onChange?.(model.id);
														setOpen(false);
													}
												}}
											>
												<div className="flex items-center gap-[8px]">
													<p className="text-[14px] text-left text-nowrap">
														{model.name}
													</p>
												</div>
												{/* disabled reason text intentionally not shown (design: gray-out only) */}
											</button>
										))}
									</div>
								)}
								{languageModelGroupByProvider.map((group) => (
									<div key={group.provider} className="flex flex-col gap-[4px]">
										<div className="text-[11px] text-link-muted px-[4px]">
											{group.provider}
										</div>
										{group.models.map((model) => (
											<button
												key={model.id}
												type="button"
												className={clsx(
													"flex gap-[12px] items-center p-[4px] rounded-[4px] text-left",
													"hover:bg-white/5 focus:bg-white/5 cursor-pointer",
												)}
												onClick={() => {
													if (isLanguageModelId(model.id)) {
														onChange?.(model.id);
														setOpen(false);
													}
												}}
											>
												<div className="flex items-center gap-[8px]">
													<p className="text-[14px] text-left text-nowrap">
														{model.name}
													</p>
												</div>
												{/* disabled reason text intentionally not shown (design: gray-out only) */}
											</button>
										))}
									</div>
								))}
							</div>
						</div>
					</div>
				</PopoverPrimitive.Content>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
}
