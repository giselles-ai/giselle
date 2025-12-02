import {
	SettingDetail,
	SettingLabel,
} from "@giselle-internal/ui/setting-label";
import {
	getEntry,
	type LanguageModelId,
	type LanguageModelTier,
} from "@giselles-ai/language-model-registry";
import type { ContentGenerationNode } from "@giselles-ai/protocol";
import { useCallback, useMemo } from "react";
import { ModelPickerV2 } from "../../../../ui/model-picker-v2";
import { ConfigurationFormField } from "./configuration-form-field";

export function ModelSettings({
	node,
	onContentGenerationContentChange,
	userTier,
}: {
	node: ContentGenerationNode;
	onContentGenerationContentChange: (
		value: Partial<ContentGenerationNode["content"]>,
	) => void;
	userTier: LanguageModelTier;
}) {
	const currentLanguageModel = useMemo(
		() => getEntry(node.content.languageModel.id),
		[node.content.languageModel.id],
	);

	const handleLanguageModelIdChange = useCallback(
		(value: LanguageModelId) => {
			const languageModel = getEntry(value);
			onContentGenerationContentChange?.({
				languageModel: {
					id: languageModel.id,
					provider: languageModel.provider,
					configuration: languageModel.defaultConfiguration,
				},
			});
		},
		[onContentGenerationContentChange],
	);

	function isDefaultConfigKey(
		k: string,
	): k is keyof typeof currentLanguageModel.defaultConfiguration {
		return k in currentLanguageModel.defaultConfiguration;
	}

	return (
		<>
			<div className="flex items-center justify-between gap-[12px]">
				<SettingDetail size="md">Model</SettingDetail>
				<ModelPickerV2
					userTier={userTier}
					value={node.content.languageModel.id}
					onValueChange={handleLanguageModelIdChange}
				/>
			</div>

			<SettingLabel>Model parameters</SettingLabel>
			<div className="col-span-2 flex flex-col gap-[12px]">
				{Object.entries(currentLanguageModel.configurationOptions).map(
					([key, option]) => {
						// Ensure the key is valid using our type guard
						if (!isDefaultConfigKey(key)) {
							console.warn(
								`Configuration key ${key} not found in default configuration`,
							);
							return null;
						}

						const currentValue =
							node.content.languageModel.configuration[key] ??
							currentLanguageModel.defaultConfiguration[key];
						return (
							<ConfigurationFormField
								key={key}
								name={key}
								option={option}
								value={currentValue}
								defaultValue={currentLanguageModel.defaultConfiguration[key]}
								onValueChange={(value) => {
									onContentGenerationContentChange({
										...node.content,
										languageModel: {
											...node.content.languageModel,
											configuration: {
												...node.content.languageModel.configuration,
												[key]: value,
											},
										},
									});
								}}
							/>
						);
					},
				)}
			</div>
		</>
	);
}
