import clsx from "clsx/lite";
import { Slider as SliderPrimitive } from "radix-ui";
import { type ComponentProps, useState } from "react";

function SliderInner({
	className,
	...props
}: ComponentProps<typeof SliderPrimitive.Root>) {
	return (
		<SliderPrimitive.Root
			className={clsx(
				"relative flex w-full touch-none select-none items-center",
				className,
			)}
			{...props}
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
	);
}
SliderInner.displayName = SliderPrimitive.Root.displayName;

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
	const [value, setValue] = useState(props.value);
	return (
		<div className="flex flex-col">
			<div className="text-[14px] py-[1.5px]">{props.label}</div>
			<div className="flex items-center">
				<SliderInner
					max={props.max}
					min={props.min}
					step={props.step}
					defaultValue={[value]}
					onValueChange={(v) => setValue(v[0])}
					onValueCommit={(v) => props.onChange?.(v[0])}
				/>
				<div className="text-[12px] font-[700] text-white-900 w-[3em] text-right">
					{props.step === 1 ? value.toString() : value.toFixed(2)}
				</div>
			</div>
		</div>
	);
}
