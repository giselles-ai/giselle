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
			<SliderPrimitive.Track className="relative h-[4px] w-full grow overflow-hidden bg-black-400">
				<SliderPrimitive.Range className="absolute h-full bg-white-900" />
			</SliderPrimitive.Track>
			<SliderPrimitive.Thumb className="block h-[12px] w-[12px] rounded-full bg-white-900" />
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
					{value.toFixed(2)}
				</div>
			</div>
		</div>
	);
}
