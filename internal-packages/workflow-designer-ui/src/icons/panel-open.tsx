import type { FC, SVGProps } from "react";

export const PanelOpenIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
	<svg
		width="24"
		height="24"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
		className="fill-current"
		role="img"
		aria-label="Panel Open"
		{...props}
	>
		<path d="M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z" />
	</svg>
);
