import clsx from "clsx/lite";
import { Switch } from "radix-ui";

export function Toggle({
	name,
	checked,
	onCheckedChange,
	children,
}: React.PropsWithChildren<{
	name: string;
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
}>) {
	return (
		<div className="flex items-center">
			{children}
			<Switch.Root
				className={clsx(
					"h-[15px] w-[27px] rounded-full outline-none",
					"border border-white-400 data-[state=checked]:border-primary-900",
					"bg-transparent data-[state=checked]:bg-primary-900",
				)}
				id={name}
				checked={checked}
				onCheckedChange={onCheckedChange}
			>
				<Switch.Thumb
					className={clsx(
						"block size-[11px] translate-x-[2px] rounded-full",
						"bg-white-400 data-[state=checked]:bg-white",
						"transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-[13px]",
						"data-[state=checked]:shadow-[0_0_2px_1px_rgba(255,255,255,0.3)]",
					)}
				/>
			</Switch.Root>
		</div>
	);
}
