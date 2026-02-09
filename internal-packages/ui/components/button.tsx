import clsx from "clsx/lite";
import { Slot } from "radix-ui";

type ButtonStyle =
	| "subtle"
	| "filled"
	| "solid"
	| "glass"
	| "outline"
	| "link"
	| "primary"
	| "destructive";
type ButtonSize = "compact" | "default" | "large";
interface ButtonProps
	extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	variant?: ButtonStyle;
	size?: ButtonSize;
	asChild?: boolean;
}

export function Button({
	className,
	children,
	leftIcon,
	rightIcon,
	variant: style = "subtle",
	size = "default",
	asChild = false,
	disabled,
	...props
}: ButtonProps) {
	const Comp = asChild ? Slot.Root : "button";
	const disabledProps = asChild
		? ({ "aria-disabled": disabled } as const)
		: ({ disabled } as const);
	return (
		<Comp
			className={clsx(
				"relative flex items-center justify-center outline-none overflow-hidden group",
				"focus-visible:ring-2 focus-visible:ring-primary-700/60 focus-visible:ring-offset-1",
				"data-[size=default]:px-[8px] data-[size=default]:py-[2px] data-[size=default]:rounded-[2px] data-[size=default]:gap-[4px]",
				"data-[size=large]:px-6 data-[size=large]:h-[38px] data-[size=large]:rounded-lg data-[size=large]:gap-[6px]",
				"data-[size=compact]:px-[4px] data-[size=compact]:py-[0px] data-[size=compact]:rounded-[2px] data-[size=compact]:gap-[2px]",
				"data-[style=subtle]:enabled:hover:bg-ghost-element-hover",
				"data-[style=filled]:bg-background data-[style=filled]:border data-[style=filled]:border-border data-[style=filled]:enabled:hover:bg-ghost-element-hover",
				"data-[style=solid]:bg-(image:--solid-button-bg) data-[style=solid]:text-inverse data-[style=solid]:border data-[style=solid]:border-button-solid-border data-[style=solid]:shadow-(--solid-button-shadow) data-[style=solid]:enabled:hover:bg-primary-800",
				"data-[style=glass]:shadow-glass data-[style=glass]:backdrop-blur-md data-[style=glass]:rounded-lg data-[style=glass]:px-4 data-[style=glass]:py-2",
				"data-[style=glass]:after:absolute data-[style=glass]:after:bg-linear-to-r data-[style=glass]:after:from-transparent data-[style=glass]:after:via-glass-highlight/60 data-[style=glass]:after:left-4 data-[style=glass]:after:right-4 data-[style=glass]:after:h-px data-[style=glass]:after:top-0",
				"data-[style=glass]:border data-[style=glass]:border-glass-border/20",
				"data-[style=outline]:border data-[style=outline]:border-t-border/60 data-[style=outline]:border-x-border/40 data-[style=outline]:border-b-black/60",
				"data-[style=link]:p-0 data-[style=link]:h-auto data-[style=link]:enabled:hover:underline",
				"data-[style=primary]:text-white/80 data-[style=primary]:bg-gradient-to-b data-[style=primary]:from-[#202530] data-[style=primary]:to-[#12151f]",
				"data-[style=primary]:border data-[style=primary]:border-black/70",
				"data-[style=primary]:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_2px_8px_rgba(5,10,20,0.4),0_1px_2px_rgba(0,0,0,0.3)]",
				"data-[style=primary]:transition-all data-[style=primary]:duration-200 data-[style=primary]:enabled:active:scale-[0.98]",
				"data-[style=destructive]:bg-error-900/10 data-[style=destructive]:text-error-900 data-[style=destructive]:border data-[style=destructive]:border-error-900/20 data-[style=destructive]:enabled:hover:bg-error-900/20",
				"enabled:cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
				className,
			)}
			data-style={style}
			data-size={size}
			{...disabledProps}
			{...props}
		>
			{style === "glass" && !disabled && (
				<>
					<div className="absolute inset-0 bg-(image:--glass-button-bg)" />
					<div className="absolute inset-0 bg-(image:--glass-button-bg-hover) opacity-0 group-hover:opacity-100 transition-opacity" />
				</>
			)}
			{leftIcon && (
				<div
					className={clsx(
						"*:size-[13px]",
						style === "destructive"
							? "*:text-error-900"
							: style === "solid" || style === "primary"
								? undefined
								: "*:text-text",
					)}
				>
					{leftIcon}
				</div>
			)}
			<Slot.Slottable>
				<div
					className={clsx(
						"text-[13px]",
						style === "destructive"
							? "text-error-900"
							: style === "solid" || style === "primary"
								? undefined
								: "text-text",
					)}
				>
					{children}
				</div>
			</Slot.Slottable>
			{rightIcon && (
				<div
					className={clsx(
						"*:size-[13px]",
						style === "destructive"
							? "*:text-error-900"
							: style === "solid" || style === "primary"
								? undefined
								: "*:text-text",
					)}
				>
					{rightIcon}
				</div>
			)}
		</Comp>
	);
}
