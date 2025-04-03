import type { FC, SVGProps } from "react";

export const VideoIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
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
		aria-label="Video icon"
		{...props}
	>
		<title>Video icon</title>
		<path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z" />
		<rect x="3" y="6" width="12" height="12" rx="2" ry="2" />
	</svg>
);
