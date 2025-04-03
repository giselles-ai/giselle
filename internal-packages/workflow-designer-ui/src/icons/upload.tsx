import type { FC, SVGProps } from "react";

export const UploadIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 20 20"
		xmlns="http://www.w3.org/2000/svg"
		className="fill-current"
		role="img"
		aria-label="Upload"
		{...props}
	>
		<path d="M10 1.5a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-1.5 0V2.25A.75.75 0 0 1 10 1.5Z" />
		<path d="M5.53 6.53a.75.75 0 0 1 0-1.06l4-4a.75.75 0 0 1 1.06 0l4 4a.75.75 0 1 1-1.06 1.06L10 3.06 6.47 6.59a.75.75 0 0 1-1.06 0Z" />
		<path d="M17.75 14a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-.75.75h-15.5a.75.75 0 0 1-.75-.75v-2.5a.75.75 0 0 1 1.5 0v1.75h14v-1.75a.75.75 0 0 1 .75-.75Z" />
	</svg>
);
