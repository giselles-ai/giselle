import clsx from "clsx/lite";

// Inline external-link icon to avoid runtime issues with icon packages in RSC
function ExternalIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="External link"
		>
			<path
				d="M14 3h7v7m0-7L10 14"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

interface DocsLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	icon?: boolean;
	/**
	 * Color tone for link text
	 * - "secondary": blue-gray token (link-muted)
	 * - "muted": white-ish subtle token
	 */
	tone?: "secondary" | "muted";
}

export function DocsLink({
	className,
	icon = true,
	tone = "muted",
	children,
	...props
}: DocsLinkProps) {
	const toneClass =
		tone === "muted"
			? "text-text/80 hover:text-text"
			: "text-link-muted hover:text-link-muted";
	return (
		<a
			className={clsx(
				"group relative",
				toneClass,
				"text-[14px] font-medium rounded-[4px] px-1.5 py-0.5 hover:bg-surface/10 transition-colors flex items-center gap-1.5 font-sans",
				// slide underline (single)
				"after:absolute after:left-0 after:bottom-[2px] after:h-[1px] after:w-full after:bg-current",
				"after:origin-left after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200",
				className,
			)}
			{...props}
		>
			{children ?? "About Workspace"}
			{icon ? <ExternalIcon /> : null}
		</a>
	);
}
