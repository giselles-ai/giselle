import { AnthropicLanguageModelData } from "@giselle-sdk/data-type";
import {
	Capability,
	anthropicLanguageModels,
	hasCapability,
} from "@giselle-sdk/language-model";
import { useUsageLimits } from "giselle-sdk/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../../ui/select";
import { Slider } from "../../../../ui/slider";
import { Switch } from "../../../../ui/switch";
import { languageModelAvailable } from "./utils";

export function AnthropicModelPanel({
	anthropicLanguageModel,
	onModelChange,
}: {
	anthropicLanguageModel: AnthropicLanguageModelData;
	onModelChange: (changedValue: AnthropicLanguageModelData) => void;
}) {
	const limits = useUsageLimits();

	const hasReasoningCapability = useMemo(() => {
		const languageModel = anthropicLanguageModels.find(
			(lm) => lm.id === anthropicLanguageModel.id,
		);
		return languageModel && hasCapability(languageModel, Capability.Reasoning);
	}, [anthropicLanguageModel.id]);

	const handleModelChange = useCallback(
		(value: string) => {
			const newLanguageModel = anthropicLanguageModels.find(
				(model) => model.id === value,
			);
			if (newLanguageModel === undefined) {
				return;
			}
			onModelChange(
				AnthropicLanguageModelData.parse({
					...anthropicLanguageModel,
					id: value,
					configurations: {
						...anthropicLanguageModel.configurations,
						reasoning:
							anthropicLanguageModel.configurations.reasoning &&
							hasCapability(newLanguageModel, Capability.Reasoning),
					},
				}),
			);
		},
		[anthropicLanguageModel, onModelChange],
	);

	return (
		<div className="flex flex-col gap-[34px]">
			<Select
				value={anthropicLanguageModel.id}
				onValueChange={handleModelChange}
			>
				<SelectTrigger>
					<SelectValue placeholder="Select a LLM" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{anthropicLanguageModels.map((anthropicLanguageModel) => (
							<SelectItem
								key={anthropicLanguageModel.id}
								value={anthropicLanguageModel.id}
								disabled={
									!languageModelAvailable(anthropicLanguageModel, limits)
								}
							>
								{anthropicLanguageModel.id}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			<div>
				<div className="grid grid-cols-2 gap-[24px]">
					<Slider
						label="Temperature"
						value={anthropicLanguageModel.configurations.temperature}
						max={2.0}
						min={0.0}
						step={0.01}
						onChange={(value) => {
							onModelChange(
								AnthropicLanguageModelData.parse({
									...anthropicLanguageModel,
									configurations: {
										...anthropicLanguageModel.configurations,
										temperature: value,
									},
								}),
							);
						}}
					/>
					<Slider
						label="Top P"
						value={anthropicLanguageModel.configurations.topP}
						max={1.0}
						min={0.0}
						step={0.01}
						onChange={(value) => {
							onModelChange(
								AnthropicLanguageModelData.parse({
									...anthropicLanguageModel,
									configurations: {
										...anthropicLanguageModel.configurations,
										topP: value,
									},
								}),
							);
						}}
					/>

					{hasReasoningCapability ? (
						<Switch
							label="Reasoning"
							name="reasoning"
							checked={anthropicLanguageModel.configurations.reasoning}
							onCheckedChange={(checked) => {
								onModelChange(
									AnthropicLanguageModelData.parse({
										...anthropicLanguageModel,
										configurations: {
											...anthropicLanguageModel.configurations,
											reasoning: checked,
										},
									}),
								);
							}}
						/>
					) : (
						<>
							{/* Refactor this because it duplicates the Switch component */}
							<div className="flex flex-col">
								<div className="flex flex-row items-center justify-between">
									<p className="text-[14px]">Reasoning</p>
									<div className="flex-grow mx-[12px] h-[1px] bg-black-200/30" />
									<p className="text-[12px]">Unsuported</p>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
