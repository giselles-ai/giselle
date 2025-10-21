type SeparatorVariant = "default" | "inverse";
type SeparatorOrientation = "horizontal" | "vertical";
interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: SeparatorVariant;
	orientation?: SeparatorOrientation;
}
export declare function Separator({
	className,
	variant,
	orientation,
	...props
}: SeparatorProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=separator.d.ts.map
