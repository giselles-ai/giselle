import { Slider } from "../../../../ui/slider";

interface CommonSliderProps<T> {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	onModelChange: (changedValue: T) => void;
	modelData: T;
	parseModelData: (data: T) => T;
	configurationKey: string;
	labelClassName?: string;
}

function CommonSlider<T extends { configurations: Record<string, unknown> }>({
	label,
	value,
	min,
	max,
	step,
	onModelChange,
	modelData,
	parseModelData,
	configurationKey,
	labelClassName,
}: CommonSliderProps<T>) {
	return (
		<Slider
			label={label}
			labelClassName={labelClassName}
			value={value}
			max={max}
			min={min}
			step={step}
			onChange={(newValue) => {
				onModelChange(
					parseModelData({
						...modelData,
						configurations: {
							...modelData.configurations,
							[configurationKey]: newValue,
						},
					}),
				);
			}}
		/>
	);
}

// Temperature slider for any model type
export function TemperatureSlider<
	T extends { configurations: { temperature: number } },
>({
	onModelChange,
	modelData,
	parseModelData,
	labelClassName,
}: {
	onModelChange: (changedValue: T) => void;
	modelData: T;
	parseModelData: (data: T) => T;
	labelClassName?: string;
}) {
	return (
		<CommonSlider
			label="Temperature"
			labelClassName={labelClassName}
			value={modelData.configurations.temperature}
			min={0.0}
			max={2.0}
			step={0.01}
			onModelChange={onModelChange}
			modelData={modelData}
			parseModelData={parseModelData}
			configurationKey="temperature"
		/>
	);
}

// Top P slider for any model type
export function TopPSlider<T extends { configurations: { topP: number } }>({
	onModelChange,
	modelData,
	parseModelData,
	labelClassName,
}: {
	onModelChange: (changedValue: T) => void;
	modelData: T;
	parseModelData: (data: T) => T;
	labelClassName?: string;
}) {
	return (
		<CommonSlider
			label="Top P"
			labelClassName={labelClassName}
			value={modelData.configurations.topP}
			min={0.0}
			max={1.0}
			step={0.01}
			onModelChange={onModelChange}
			modelData={modelData}
			parseModelData={parseModelData}
			configurationKey="topP"
		/>
	);
}

// Frequency Penalty slider (used by OpenAI and Perplexity)
export function FrequencyPenaltySlider<
	T extends { configurations: { frequencyPenalty: number } },
>({
	onModelChange,
	modelData,
	parseModelData,
	labelClassName,
}: {
	onModelChange: (changedValue: T) => void;
	modelData: T;
	parseModelData: (data: T) => T;
	labelClassName?: string;
}) {
	return (
		<CommonSlider
			label="Frequency Penalty"
			labelClassName={labelClassName}
			value={modelData.configurations.frequencyPenalty}
			min={0.0}
			max={2.0}
			step={0.01}
			onModelChange={onModelChange}
			modelData={modelData}
			parseModelData={parseModelData}
			configurationKey="frequencyPenalty"
		/>
	);
}

// Presence Penalty slider (used by OpenAI and Perplexity)
export function PresencePenaltySlider<
	T extends { configurations: { presencePenalty: number } },
>({
	onModelChange,
	modelData,
	parseModelData,
	min = 0.0,
	labelClassName,
}: {
	onModelChange: (changedValue: T) => void;
	modelData: T;
	parseModelData: (data: T) => T;
	min?: number;
	labelClassName?: string;
}) {
	return (
		<CommonSlider
			label="Presence Penalty"
			labelClassName={labelClassName}
			value={modelData.configurations.presencePenalty}
			min={min}
			max={2.0}
			step={0.01}
			onModelChange={onModelChange}
			modelData={modelData}
			parseModelData={parseModelData}
			configurationKey="presencePenalty"
		/>
	);
}
