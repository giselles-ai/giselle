import clsx from "clsx/lite";
import type { FC, SVGProps } from "react";

export const MemoIcon: FC<SVGProps<SVGSVGElement>> = ({
	className,
	...props
}) => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 16 16"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		className={clsx("fill-current", className)}
		{...props}
	>
		<title>MemoIcon</title>
		<path d="M2 2C2 1.44772 2.44772 1 3 1H10C10.2652 1 10.5196 1.10536 10.7071 1.29289L13.7071 4.29289C13.8946 4.48043 14 4.73478 14 5V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V2ZM3 2V13H13V5H10C9.44772 5 9 4.55228 9 4V2H3ZM10 2.41421V4H11.5858L10 2.41421ZM4 6C4 5.44772 4.44772 5 5 5H11C11.5523 5 12 5.44772 12 6C12 6.55228 11.5523 7 11 7H5C4.44772 7 4 6.55228 4 6ZM5 8C4.44772 8 4 8.44772 4 9C4 9.55228 4.44772 10 5 10H9C9.55228 10 10 9.55228 10 9C10 8.44772 9.55228 8 9 8H5Z" />
	</svg>
);
