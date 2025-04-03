import type { FC, SVGProps } from "react";

export const AudioIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		role="img"
		aria-label="Audio icon"
		{...props}
	>
		<title>Audio icon</title>
		<path d="M12 3v18" />
		<path d="M8 8v8" />
		<path d="M16 8v8" />
		<path d="M4 13v3" />
		<path d="M20 13v3" />
	</svg>
);
