import type { ReactNode } from "react";
import { GiselleLogo } from "@/components/giselle-logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<div className="bg-black-100 relative">
			<div className="z-10 relative">{children}</div>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 100 100"
				className="absolute inset-0 w-full h-full z-0  blur-[100px] fill-black-80"
			>
				<title>ambient light</title>
				<circle cx="50" cy="50" r="50" />
			</svg>
			<div className="z-0 absolute inset-0 flex justify-center overflow-hidden">
				<GiselleLogo className="w-[110%] h-[110%] absolute -bottom-[20%] fill-black-30 opacity-5" />
			</div>
		</div>
	);
}
