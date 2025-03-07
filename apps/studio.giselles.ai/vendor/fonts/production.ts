import { Geist, Hubot_Sans } from "next/font/google";
import localFont from "next/font/local";

export const rosart = localFont({
	src: [
		{
			path: "./Rosart-Regular.woff2",
			weight: "400",
			style: "normal",
		},
		{
			path: "./Rosart-RegularItalic.woff2",
			weight: "400",
			style: "italic",
		},
		{
			path: "./Rosart-Medium.woff2",
			weight: "500",
			style: "normal",
		},
		{
			path: "./Rosart-SemiBold.woff2",
			weight: "600",
			style: "normal",
		},
		{
			path: "./Rosart-Bold.woff2",
			weight: "700",
			style: "normal",
		},
	],
	variable: "--font-rosart",
});

export const hubot = Hubot_Sans({
	variable: "--font-hubot-sans",
	subsets: ["latin"],
});

export const geist = Geist({
	variable: "--font-geist",
	subsets: ["latin"],
});
