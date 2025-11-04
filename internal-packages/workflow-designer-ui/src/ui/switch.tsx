import clsx from "clsx/lite";
import { Switch as RadixSwitch } from "radix-ui";
import type { ReactNode } from "react";

export const Switch = ({
	label,
	name,
	checked,
	onCheckedChange,
	note,
}: {
	label: string;
	name: string;
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	note?: ReactNode;
}) => (
	<div className="flex flex-col">
		<div className="flex flex-row items-center justify-between">
			<label className="text-[14px]" htmlFor={name}>
				{label}
			</label>

			<RadixSwitch.Root
				className={clsx(
					"h-[15px] w-[27px] rounded-full outline-none",
					"border border-white-400 data-[state=checked]:border-[var(--color-primary-900)]",
					"data-[state=checked]:bg-[var(--color-primary-900)]",
				)}
				id={name}
				checked={checked}
				onCheckedChange={onCheckedChange}
			>
				<RadixSwitch.Thumb
					className={clsx(
						"block size-[11px] translate-x-[2px] rounded-full",
						"bg-[#fff] data-[state=checked]:bg-[#fff]",
						"transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-[13px]",
					)}
				/>
			</RadixSwitch.Root>
		</div>
		{note && <p className="text-[12px] text-red-900 mt-[4px]">{note}</p>}
	</div>
);
