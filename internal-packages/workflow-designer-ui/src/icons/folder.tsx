import type { FC, SVGProps } from "react";

export const FolderIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
	<svg
		width="26"
		height="25"
		viewBox="0 0 26 25"
		xmlns="http://www.w3.org/2000/svg"
		className="fill-current"
		role="img"
		aria-label="Folder"
		{...props}
	>
		<path
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			d="M3 4c0-1.1.9-2 2-2h5L12 4h9a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V4z"
		/>
		<path
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			d="M7 11h12M7 16h12"
		/>
	</svg>
);
