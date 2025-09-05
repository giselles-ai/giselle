import clsx from "clsx/lite";
import { Slot } from "radix-ui";

type ButtonStyle = "subtle" | "filled" | "solid" | "glass" | "outline" | "link";
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
	...props
}: ButtonProps) {
	const Comp = asChild ? Slot.Root : "button";
	return (
		<Comp
			className={clsx(
				"relative flex items-center justify-center outline-none overflow-hidden",
				"focus-visible:ring-2 focus-visible:ring-primary-700/60 focus-visible:ring-offset-1",
				"data-[size=default]:px-[8px] data-[size=default]:py-[2px] data-[size=default]:rounded-[2px] data-[size=default]:gap-[4px]",
				"data-[size=large]:px-5 data-[size=large]:py-2 data-[size=large]:h-[40px] data-[size=large]:rounded-lg data-[size=large]:gap-[6px]",
				"data-[size=compact]:px-[4px] data-[size=compact]:py-[0px] data-[size=compact]:rounded-[2px] data-[size=compact]:gap-[2px]",
				"data-[style=subtle]:hover:bg-ghost-element-hover",
				"data-[style=filled]:bg-background data-[style=filled]:border data-[style=filled]:border-border data-[style=filled]:hover:bg-ghost-element-hover",
				"data-[style=solid]:bg-(image:--solid-button-bg) data-[style=solid]:text-white-900 data-[style=solid]:border data-[style=solid]:border-button-solid-border data-[style=solid]:shadow-(--solid-button-shadow) data-[style=solid]:hover:bg-primary-800",
				"data-[style=glass]:shadow-glass data-[style=glass]:backdrop-blur-md data-[style=glass]:rounded-lg data-[style=glass]:px-4 data-[style=glass]:py-2",
				"data-[style=glass]:after:absolute data-[style=glass]:after:bg-linear-to-r data-[style=glass]:after:from-transparent data-[style=glass]:after:via-glass-highlight/60 data-[style=glass]:after:left-4 data-[style=glass]:after:right-4 data-[style=glass]:after:h-px data-[style=glass]:after:top-0",
				"data-[style=glass]:border data-[style=glass]:border-glass-border/20",
				"data-[style=outline]:border data-[style=outline]:border-t-border/60 data-[style=outline]:border-x-border/40 data-[style=outline]:border-b-black/60",
				"data-[style=link]:p-0 data-[style=link]:h-auto data-[style=link]:hover:underline",
				"cursor-pointer transition-colors",
				className,
			)}
			data-style={style}
			data-size={size}
			{...props}
		>
			{style === "glass" && (
				<>
					<div className="absolute inset-0 bg-(image:--glass-button-bg)" />
					<div className="absolute inset-0 bg-(image:--glass-button-bg-hover) opacity-0 hover:opacity-100 transition-opacity" />
				</>
			)}
			{leftIcon && <div className="*:size-[13px] *:text-text">{leftIcon}</div>}
			<Slot.Slottable>
				<div className="text-[13px] text-text">{children}</div>
			</Slot.Slottable>
			{rightIcon && <div className="*:size-[13px]">{rightIcon}</div>}
		</Comp>
	);
}
