import type { FC, SVGProps } from "react";

export const PanelCloseIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
	<svg
		width="24"
		height="24"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
		className="fill-current"
		role="img"
		aria-label="Panel Close"
		{...props}
	>
		<path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19M17,11V13H7V11H17Z" />
	</svg>
);
