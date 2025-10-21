type ButtonStyle =
	| "subtle"
	| "filled"
	| "solid"
	| "glass"
	| "outline"
	| "link"
	| "primary";
type ButtonSize = "compact" | "default" | "large";
interface ButtonProps
	extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	variant?: ButtonStyle;
	size?: ButtonSize;
	asChild?: boolean;
}
export declare function Button({
	className,
	children,
	leftIcon,
	rightIcon,
	variant: style,
	size,
	asChild,
	...props
}: ButtonProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=button.d.ts.map
