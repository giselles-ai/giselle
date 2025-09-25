import { GoogleLanguageModelData, type ToolSet } from "@giselle-sdk/data-type";
import { useUsageLimits } from "@giselle-sdk/giselle/react";
import { useEffect, useMemo, useState } from "react";
import { Switch } from "../../../../ui/switch";
import { validateUrl } from "../../../lib/validate-url";
import { TemperatureSlider, TopPSlider } from "./shared-model-controls";

export function GoogleModelPanel({
	googleLanguageModel,
	onModelChange,
	onSearchGroundingConfigurationChange,
	tools,
	onToolChange,
}: {
	googleLanguageModel: GoogleLanguageModelData;
	onModelChange: (changedValue: GoogleLanguageModelData) => void;
	onSearchGroundingConfigurationChange: (enabled: boolean) => void;
	tools?: ToolSet;
	onToolChange: (changedValue: ToolSet) => void;
}) {
	useUsageLimits();
	const [urlInput, setUrlInput] = useState<string>("");
	const [urlError, setUrlError] = useState<string | null>(null);
	const googleUrlContextUrls = useMemo(
		() => tools?.googleUrlContext?.urls ?? [],
		[tools?.googleUrlContext?.urls],
	);

	useEffect(() => {
		if (googleUrlContextUrls.length === 0) {
			setUrlInput("");
			return;
		}
		setUrlInput(googleUrlContextUrls.join("\n"));
	}, [googleUrlContextUrls]);

	const isUrlContextEnabled = tools?.googleUrlContext !== undefined;

	const parseUrlInput = (value: string) => {
		const entries = value
			.split(/\r?\n/)
			.map((entry) => entry.trim())
			.filter((entry) => entry.length > 0);
		if (entries.length === 0) {
			return {
				success: false as const,
				error: "Enter at least one URL.",
			};
		}
		const urls: string[] = [];
		for (const entry of entries) {
			const parsed = validateUrl(entry);
			if (parsed === null) {
				return {
					success: false as const,
					error: "One or more URLs are invalid.",
				};
			}
			urls.push(parsed.href);
		}
		if (urls.length > 20) {
			return {
				success: false as const,
				error: "You can provide up to 20 URLs.",
			};
		}
		return { success: true as const, urls };
	};

	const cloneToolSetWithoutUrlContext = (currentTools?: ToolSet): ToolSet => {
		const nextTools: ToolSet = {};
		if (currentTools?.github !== undefined) {
			nextTools.github = currentTools.github;
		}
		if (currentTools?.postgres !== undefined) {
			nextTools.postgres = currentTools.postgres;
		}
		if (currentTools?.openaiWebSearch !== undefined) {
			nextTools.openaiWebSearch = currentTools.openaiWebSearch;
		}
		if (currentTools?.anthropicWebSearch !== undefined) {
			nextTools.anthropicWebSearch = currentTools.anthropicWebSearch;
		}
		return nextTools;
	};

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
					<Switch
						label="Search Grounding"
						name="searchGrounding"
						checked={googleLanguageModel.configurations.searchGrounding}
						onCheckedChange={(checked) => {
							onSearchGroundingConfigurationChange(checked);
						}}
					/>
				</div>
			</div>
			<div className="flex flex-col gap-[12px]">
				<Switch
					label="URL Context"
					name="urlContext"
					checked={isUrlContextEnabled}
					onCheckedChange={(checked) => {
						if (!checked) {
							const nextTools = cloneToolSetWithoutUrlContext(tools);
							onToolChange(nextTools);
							setUrlError(null);
							return;
						}
						const result = parseUrlInput(urlInput);
						if (!result.success) {
							setUrlError(result.error);
							return;
						}
						const nextTools = cloneToolSetWithoutUrlContext(tools);
						onToolChange({
							...nextTools,
							googleUrlContext: { urls: result.urls },
						});
						setUrlError(null);
					}}
					note="Gemini can crawl the URLs you provide when this is enabled."
				/>
				<textarea
					className="w-full min-h-[96px] rounded-[8px] border border-white-900 bg-black-100 p-[12px] text-white-800 outline-none"
					placeholder={"https://example.com\nhttps://docs.example.com"}
					value={urlInput}
					onChange={(event) => {
						const value = event.target.value;
						setUrlInput(value);
						if (!isUrlContextEnabled) {
							return;
						}
						const result = parseUrlInput(value);
						if (!result.success) {
							setUrlError(result.error);
							return;
						}
						const nextTools = cloneToolSetWithoutUrlContext(tools);
						onToolChange({
							...nextTools,
							googleUrlContext: { urls: result.urls },
						});
						setUrlError(null);
					}}
					spellCheck={false}
				/>
				{urlError !== null ? (
					<p className="text-[12px] text-warning-900">{urlError}</p>
				) : (
					<p className="text-[12px] text-white-700">
						Add up to 20 URLs, one per line.
					</p>
				)}
			</div>
		</div>
	);
}
