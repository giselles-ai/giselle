import type { SVGProps } from "react";

export function IntegrationIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			width="20"
			height="20"
			viewBox="0 0 20 20"
			xmlns="http://www.w3.org/2000/svg"
			className="fill-none"
			{...props}
		>
			<title>Integration Icon</title>
			<path
				className="fill-white"
				d="M16.73 8.49L13.8 13.32C13.67 13.54 13.44 13.67 13.18 13.67H9.77C9.42 14.57 8.54 15.21 7.51 15.21C6.17 15.21 5.08 14.12 5.08 12.78C5.08 11.44 6.17 10.35 7.51 10.35C8.66 10.35 9.61 11.15 9.87 12.22H12.77L15.7 7.39C15.83 7.17 16.06 7.04 16.32 7.04H18.6V2.74L15.86 0H2.74L0 2.74V9.71H1.87L4.8 4.88C4.93 4.66 5.16 4.53 5.42 4.53H8.83C9.18 3.63 10.06 2.99 11.09 2.99C12.43 2.99 13.52 4.08 13.52 5.42C13.52 6.76 12.43 7.85 11.09 7.85C9.94 7.85 8.99 7.05 8.73 5.98H5.83L2.9 10.81C2.77 11.03 2.54 11.16 2.28 11.16H0V15.48L2.74 18.22H15.87L18.61 15.48V8.51H16.74L16.73 8.49Z"
			/>
		</svg>
	);
}
