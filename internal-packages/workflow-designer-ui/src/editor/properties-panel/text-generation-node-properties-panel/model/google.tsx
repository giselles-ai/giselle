import type { GoogleLanguageModelData as GoogleLanguageModelDataType } from "@giselle-sdk/data-type";
import {
	GoogleLanguageModelData,
	TEXT_GENERATION_CONTEXT_SOURCE_VALUES,
	type TextGenerationContextSource,
} from "@giselle-sdk/data-type";
import { useUsageLimits } from "@giselle-sdk/giselle/react";
import { TemperatureSlider, TopPSlider } from "./shared-model-controls";

export function GoogleModelPanel({
	googleLanguageModel,
	onModelChange,
	contextSource,
	onContextSourceChange,
}: {
	googleLanguageModel: GoogleLanguageModelDataType;
	onModelChange: (changedValue: GoogleLanguageModelDataType) => void;
	contextSource: TextGenerationContextSource;
	onContextSourceChange: (mode: TextGenerationContextSource) => void;
}) {
	useUsageLimits();

	const contextOptions: Array<{
		value: TextGenerationContextSource;
		title: string;
		description: string;
		extra?: string;
	}> = TEXT_GENERATION_CONTEXT_SOURCE_VALUES.map((value) => {
		switch (value) {
			case "none":
				return {
					value,
					title: "None",
					description: "Use only the prompt without additional context.",
				};
			case "google_search":
				return {
					value,
					title: "Search Grounding",
					description: "Use Google Search to gather supplemental context.",
				};
			case "url_context":
				return {
					value,
					title: "URL Context",
					description:
						"Include HTTPS URLs directly in the prompt to fetch their content.",
					extra:
						"Add up to 20 HTTPS URLs in the prompt body. Each must be on its own line or separated by whitespace.",
				};
		}
	});

	return (
		<div className="flex flex-col gap-[34px]">
			<div>
				<div className="grid grid-cols-2 gap-[24px]">
					<TemperatureSlider
						onModelChange={onModelChange}
						modelData={googleLanguageModel}
						parseModelData={GoogleLanguageModelData.parse}
					/>
					<TopPSlider
						onModelChange={onModelChange}
						modelData={googleLanguageModel}
						parseModelData={GoogleLanguageModelData.parse}
					/>
				</div>
			</div>
			<div className="flex flex-col gap-[12px]">
				<p className="text-[12px] text-white-700">Context Source</p>
				<div className="flex flex-col gap-[12px]">
					{contextOptions.map((option) => (
						<label
							key={option.value}
							className="flex items-start gap-[12px] cursor-pointer"
						>
							<input
								type="radio"
								name="context-source"
								value={option.value}
								checked={contextSource === option.value}
								onChange={(event) => {
									if (!event.target.checked) {
										return;
									}
									onContextSourceChange(option.value);
								}}
								className="mt-[4px] h-[16px] w-[16px] accent-primary-900"
							/>
							<span className="flex flex-col gap-[4px]">
								<span className="text-[12px] text-white-900 font-medium">
									{option.title}
								</span>
								<span className="text-[12px] text-white-700">
									{option.description}
								</span>
								{option.extra ? (
									<span className="text-[12px] text-white-500">
										{option.extra}
									</span>
								) : null}
							</span>
						</label>
					))}
				</div>
			</div>
		</div>
	);
}
