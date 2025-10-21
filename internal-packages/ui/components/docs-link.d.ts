interface DocsLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	icon?: boolean;
	/**
	 * Color tone for link text
	 * - "secondary": blue-gray token (link-muted)
	 * - "muted": white-ish subtle token
	 */
	tone?: "secondary" | "muted";
}
export declare function DocsLink({
	className,
	icon,
	tone,
	children,
	...props
}: DocsLinkProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=docs-link.d.ts.map
