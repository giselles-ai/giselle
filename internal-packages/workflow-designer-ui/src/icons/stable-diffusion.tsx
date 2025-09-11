import clsx from "clsx/lite";
import type { SVGProps } from "react";

function _StableDiffusionColorIcon({
	className,
	...props
}: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 103.1 85.63"
			xmlns="http://www.w3.org/2000/svg"
			role="graphics-symbol"
			className={clsx("fill-current", className)}
			{...props}
		>
			<defs>
				<linearGradient
					id="linear-gradient"
					x1="31.25"
					y1="-5"
					x2="31.25"
					y2="80.6"
					gradientTransform="translate(0 80.6) scale(1 -1)"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0" stop-color="#a381ff" />
					<stop offset="1" stop-color="#9d38ff" />
				</linearGradient>
			</defs>
			<path
				style={{
					fill: "url(#linear-gradient)",
				}}
				d="m57.4,6.6v17.9c-5.8-4.3-15.3-7.6-24.6-7.6-8.3,0-12.9,3.1-12.9,8,0,5.2,5.3,7.3,15.3,9.9,13.1,3.4,27.3,7.9,27.3,24.8,0,15.7-12.3,26-33.4,26-11.4,0-21.5-3.1-28.8-8.3v-19.4c6.7,5.9,16,10.7,27.9,10.7,9.2,0,14.4-3.4,14.4-8.8,0-5.8-6.4-7.7-17.4-11C12,45.1,0,40,0,25.4S12,0,32,0c9.6,0,19.4,2.6,25.4,6.6Z"
			/>
			<path
				style={{
					fill: "#e80000",
				}}
				d="m79.1,72.4c0-6.8,5.2-12,12-12s12,5.2,12,12-5.3,12-12,12c-6.8.1-12-5.3-12-12Z"
			/>
		</svg>
	);
}

export function StableDiffusionIcon({
	className,
	...props
}: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 103.1 85.63"
			xmlns="http://www.w3.org/2000/svg"
			role="graphics-symbol"
			className={clsx("fill-current", className)}
			{...props}
		>
			<path
				d="m57.4,6.6v17.9c-5.8-4.3-15.3-7.6-24.6-7.6-8.3,0-12.9,3.1-12.9,8,0,5.2,5.3,7.3,15.3,9.9,13.1,3.4,27.3,7.9,27.3,24.8,0,15.7-12.3,26-33.4,26-11.4,0-21.5-3.1-28.8-8.3v-19.4c6.7,5.9,16,10.7,27.9,10.7,9.2,0,14.4-3.4,14.4-8.8,0-5.8-6.4-7.7-17.4-11C12,45.1,0,40,0,25.4S12,0,32,0c9.6,0,19.4,2.6,25.4,6.6Z"
				fill="currentColor"
			/>
			<path
				d="m79.1,72.4c0-6.8,5.2-12,12-12s12,5.2,12,12-5.3,12-12,12c-6.8.1-12-5.3-12-12Z"
				fill="currentColor"
			/>
		</svg>
	);
}
