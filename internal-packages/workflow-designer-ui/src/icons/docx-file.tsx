import clsx from "clsx/lite";
import type { SVGProps } from "react";

export function DocxFileIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 23 23"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="graphics-symbol"
			className={clsx("fill-current", className)}
			{...props}
		>
			<path d="M21.96 5.65L17.41 0.88C16.88 0.32 16.12 0 15.35 0H3.45C1.55 0 0 1.55 0 3.45V7.15C0 7.7 0.45 8.15 1 8.15C1.55 8.15 2 7.7 2 7.15V3.45C2 2.65 2.65 2 3.45 2H13.72V6.79C13.72 8.61 15.2 10.09 17.01 10.09H20.88V18.88C20.88 19.68 20.23 20.33 19.43 20.33H3.45C2.65 20.33 2 19.68 2 18.88V18.76C2 18.21 1.55 17.76 1 17.76C0.45 17.76 0 18.21 0 18.76V18.88C0 20.78 1.55 22.33 3.45 22.33H19.43C21.33 22.33 22.88 20.78 22.88 18.88V7.96C22.88 7.1 22.55 6.28 21.95 5.65H21.96ZM17.01 8.09C16.3 8.09 15.72 7.51 15.72 6.79V2.1C15.81 2.14 15.89 2.2 15.96 2.27L20.51 7.04C20.75 7.29 20.88 7.62 20.88 7.97V8.1H17.01V8.09Z" />
		</svg>
	);
}
