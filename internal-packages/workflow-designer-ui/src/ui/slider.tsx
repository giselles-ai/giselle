import { Slider as SliderPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

interface SliderProps
	extends Pick<
		ComponentProps<typeof SliderPrimitive.Root>,
		"max" | "min" | "step"
	> {
	label: string;
	value: number;
	onChange?: (value: number) => void;
}
export function Slider(props: SliderProps) {
	return (
		<div className="flex flex-col">
			<div className="text-[14px] mb-[8px]">{props.label}</div>
			<div className="flex items-center gap-[12px]">
				<SliderPrimitive.Root
					className="relative flex w-full touch-none select-none items-center flex-1"
					max={props.max}
					min={props.min}
					step={props.step}
					value={[props.value]}
					onValueChange={(v) => props.onChange?.(v[0])}
				>
					<SliderPrimitive.Track
						className="relative h-[2px] w-full grow overflow-hidden bg-transparent
						before:content-[''] before:absolute before:inset-0
						before:bg-[repeating-linear-gradient(90deg,#F7F9FD_0px,#F7F9FD_2px,transparent_2px,transparent_4px)]"
					>
						<SliderPrimitive.Range className="absolute h-full bg-white-900 rounded-[9999px]" />
					</SliderPrimitive.Track>
					<SliderPrimitive.Thumb
						className="block h-[10px] w-[10px] rounded-full bg-white-900
						transition-transform hover:scale-110 focus:outline-none focus:ring-0 active:outline-none active:ring-0"
					/>
				</SliderPrimitive.Root>
				<div className="text-[12px] font-[700] text-white-900 w-[3em] text-right">
					{props.value.toFixed(2)}
				</div>
			</div>
		</div>
	);
}
