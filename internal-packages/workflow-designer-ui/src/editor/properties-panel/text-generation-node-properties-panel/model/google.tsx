import {
	GoogleLanguageModel,
	googleLanguageModels,
} from "@giselle-sdk/language-model";
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

export function GoogleModelPanel({
	googleLanguageModel,
	onModelChange,
}: {
	googleLanguageModel: GoogleLanguageModel;
	onModelChange: (changedValue: GoogleLanguageModel) => void;
}) {
	return (
		<div className="flex flex-col gap-[34px]">
			<Select
				value={googleLanguageModel.id}
				onValueChange={(value) => {
					onModelChange(
						GoogleLanguageModel.parse({
							...googleLanguageModel,
							id: value,
						}),
					);
				}}
			>
				<SelectTrigger>
					<SelectValue placeholder="Select a LLM" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{googleLanguageModels.map((googleLanguageModel) => (
							<SelectItem
								key={googleLanguageModel.id}
								value={googleLanguageModel.id}
							>
								{googleLanguageModel.id}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			<div>
				<div className="grid grid-cols-2 gap-[24px]">
					<Slider
						label="Temperature"
						value={googleLanguageModel.configurations.temperature}
						max={2.0}
						min={0.0}
						step={0.01}
						onChange={(value) => {
							onModelChange(
								GoogleLanguageModel.parse({
									...googleLanguageModel,
									configurations: {
										...googleLanguageModel.configurations,
										temperature: value,
									},
								}),
							);
						}}
					/>
					<Slider
						label="Top P"
						value={googleLanguageModel.configurations.topP}
						max={1.0}
						min={0.0}
						step={0.01}
						onChange={(value) => {
							onModelChange(
								GoogleLanguageModel.parse({
									...googleLanguageModel,
									configurations: {
										...googleLanguageModel.configurations,
										topP: value,
									},
								}),
							);
						}}
					/>
					<Switch
						label="Search Grounding"
						name="searchGrounding"
						checked={googleLanguageModel.configurations.searchGrounding}
						onCheckedChange={(checked) => {
							onModelChange(
								GoogleLanguageModel.parse({
									...googleLanguageModel,
									configurations: {
										...googleLanguageModel.configurations,
										searchGrounding: checked,
									},
								}),
							);
						}}
					/>
				</div>
			</div>
		</div>
	);
}
