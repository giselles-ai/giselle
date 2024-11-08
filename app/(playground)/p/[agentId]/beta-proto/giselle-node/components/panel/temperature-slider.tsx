import { useState } from "react";
import { Slider } from "../../../components/slider";

interface TemperatureSliderProps {
	value: number;
	onChange: (temperature: number) => void;
}
export function TemperatureSlider(props: TemperatureSliderProps) {
	const [temperature, setTemperature] = useState(props.value);
	return (
		<div className="flex items-center gap-[8px]">
			<div className="font-rosart text-[14px] text-black-40 w-[100px]">
				Temperature
			</div>
			<Slider
				max={1.0}
				min={0.0}
				step={0.1}
				defaultValue={[temperature]}
				onValueChange={(v) => setTemperature(v[0])}
				onValueCommit={(v) => props.onChange(v[0])}
			/>
			<div className="text-[12px] text-black-40 w-[3em] text-right">
				{temperature}
			</div>
		</div>
	);
}