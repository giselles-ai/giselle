import clsx from "clsx/lite";
import { Switch as RadixSwitch } from "radix-ui";

export const Switch = ({
	label,
	name,
	checked,
	onCheckedChange,
}: {
	label: string;
	name: string;
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
}) => (
	<div className="flex flex-col">
		<label className="text-[14px] py-[1.5px]" htmlFor={name}>
			{label}
		</label>
		<RadixSwitch.Root
			className={clsx(
				"h-[15px] w-[27px] rounded-full outline-none",
				"border border-black-300 data-[state=checked]:border-primary-900",
				"bg-transparent data-[state=checked]:bg-primary-900",
			)}
			id={name}
			checked={checked}
			onCheckedChange={onCheckedChange}
		>
			<RadixSwitch.Thumb
				className={clsx(
					"block size-[11px] translate-x-[1px] rounded-full",
					"bg-black-300 data-[state=checked]:bg-white-900",
					"transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-[13px]",
				)}
			/>
		</RadixSwitch.Root>
	</div>
);
