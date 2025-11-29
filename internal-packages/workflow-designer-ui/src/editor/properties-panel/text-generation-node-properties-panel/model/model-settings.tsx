import { SettingDetail } from "@giselle-internal/ui/setting-label";
import {
	anthropicLanguageModels,
	googleLanguageModels,
	hasTierAccess,
	type LanguageModel,
	openaiLanguageModels,
	Tier,
} from "@giselles-ai/language-model";
import type { TextGenerationNode } from "@giselles-ai/protocol";
import { useUsageLimits } from "@giselles-ai/react";
import { useMemo } from "react";
import { ModelPicker } from "../../../../ui/model-picker";
import { ProTag } from "../../../tool";

function useModelGroups(userTier: Tier) {
	return useMemo(() => {
		const toModelPickerModels = (models: LanguageModel[]) =>
			models.map((model) => {
				const disabled = !hasTierAccess(model, userTier);
				return {
					id: model.id,
					label: model.id,
					badge: model.tier === Tier.enum.pro ? <ProTag /> : undefined,
					disabled,
					disabledReason: disabled
						? "Upgrade to Pro to use this model."
						: undefined,
				};
			});

		return [
			{
				provider: "openai",
				label: "OpenAI",
				models: toModelPickerModels(openaiLanguageModels),
			},
			{
				provider: "anthropic",
				label: "Anthropic",
				models: toModelPickerModels(anthropicLanguageModels),
			},
			{
				provider: "google",
				label: "Google",
				models: toModelPickerModels(googleLanguageModels),
			},
		];
	}, [userTier]);
}

export function ModelSettings({
	node,
	onModelChange,
}: {
	node: TextGenerationNode;
	onModelChange: ({ provider, id }: { provider: string; id: string }) => void;
}) {
	const usageLimits = useUsageLimits();
	const groups = useModelGroups(usageLimits?.featureTier ?? Tier.enum.free);
	return (
		<div className="flex items-center justify-between gap-[12px]">
			<SettingDetail size="md">Model</SettingDetail>
			<ModelPicker
				currentProvider={node.content.llm.provider}
				currentModelId={node.content.llm.id}
				groups={groups}
				fullWidth={false}
				onSelect={(provider, id) => {
					onModelChange({ provider, id: id });
				}}
			/>
		</div>
	);
}
