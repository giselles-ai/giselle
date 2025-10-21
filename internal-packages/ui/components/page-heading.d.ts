type HeadingAs = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div";
interface PageHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
	as?: HeadingAs;
	glow?: boolean;
	glowColor?: string;
}
export declare function PageHeading({
	as,
	glow,
	glowColor,
	className,
	style,
	children,
	...props
}: PageHeadingProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=page-heading.d.ts.map
