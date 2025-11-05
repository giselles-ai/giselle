import clsx from "clsx/lite";
import { Switch } from "radix-ui";

export function Toggle({
    name,
    checked,
    onCheckedChange,
    disabled,
    children,
    className,
}: React.PropsWithChildren<{
    name: string;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
}>) {
	return (
        <div className={clsx("flex w-full items-center justify-between gap-3", className)}>
			{children}
			<Switch.Root
				className={clsx(
					"h-[15px] w-[27px] rounded-full outline-none transition-colors",
					"border border-[var(--color-text-inverse,#fff)] data-[state=checked]:border-primary-900",
					"bg-transparent data-[state=checked]:bg-primary-900",
					disabled && "opacity-50 cursor-not-allowed",
				)}
				id={name}
				checked={checked}
				onCheckedChange={onCheckedChange}
				disabled={disabled}
			>
				<Switch.Thumb
					className={clsx(
						"block size-[11px] translate-x-[2px] rounded-full",
						"bg-[var(--color-text-inverse,#fff)]",
						"transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-[13px]",
					)}
				/>
			</Switch.Root>
		</div>
	);
}
