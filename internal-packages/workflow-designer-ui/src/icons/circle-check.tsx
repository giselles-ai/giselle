import clsx from "clsx/lite";
import type { FC, SVGProps } from "react";

export function CircleCheckIcon({
	className,
	...props
}: SVGProps<SVGSVGElement>) {
	return (
		<svg
			width="20"
			height="20"
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="graphics-symbol"
		>
			<path
				d="M5.91274 9.79617L5.91979 9.79304L5.91274 9.79617L5.91274 9.79617ZM5.91274 9.79617L5.91273 9.79617L5.89776 9.8028L5.91274 9.79617ZM5.92007 9.7798L5.92002 9.7799L5.92007 9.7798ZM5.92007 9.7798L5.92007 9.7798L5.92002 9.7797L5.92007 9.7798ZM5.92007 9.7798L5.92007 9.7798L5.92075 9.78149L5.92007 9.7798ZM14.0799 6.91795L14.08 6.91788L14.0799 6.91795Z"
				stroke="#39FF7F"
				stroke-width="2"
			/>
			<circle cx="10" cy="10" r="9" stroke="#39FF7F" stroke-width="2" />
		</svg>
	);
}
