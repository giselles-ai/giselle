import type { Metadata } from "next";
import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { Hubot_Sans } from "next/font/google";

const hubot = Hubot_Sans({
	weight: "variable",
	variable: "--font-hubot-sans",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Giselle / Playground",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={`${GeistSans.variable} ${hubot.variable}`}>
			<body>{children}</body>
		</html>
	);
}
