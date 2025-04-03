import type { FC, SVGProps } from "react";

export const VariableIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 20 20"
		xmlns="http://www.w3.org/2000/svg"
		className="fill-current"
		role="img"
		aria-label="Variable"
		{...props}
	>
		<path d="M15 3H5C3.9 3 3 3.9 3 5v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M7 7h2v2H7V7zm4 0h2v2h-2V7zm-4 4h2v2H7v-2zm4 0h2v2h-2v-2z"
			fill="currentColor"
			style={{ fill: "white" }}
		/>
	</svg>
);
