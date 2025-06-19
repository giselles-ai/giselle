import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { GoogleTagManager } from "@next/third-parties/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { DM_Mono, DM_Sans } from "next/font/google";
import { Suspense } from "react";
import { PostHogPageView } from "./posthog-page-view";
import { PHProvider } from "./providers";

const title = "Giselle";
const description = "AI for Agentic Workflows. Human-AI Collaboration";
const url = process.env.NEXT_PUBLIC_SITE_URL || "https://studio.giselles.ai";

const dmSans = DM_Sans({
	weight: "variable",
	variable: "--font-dm-sans",
	subsets: ["latin"],
});

const dmMono = DM_Mono({
	weight: ["300", "500"],
	variable: "--font-dm-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title,
	description,
	openGraph: {
		title,
		description,
		url,
		siteName: title,
		images: [
			{
				url: `${url}/og.png`,
				width: 1200,
				height: 600,
			},
		],
		locale: "en_US",
		type: "website",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${dmSans.variable} ${dmMono.variable}`}
		>
			<GoogleTagManager gtmId={process.env.GTM_ID ?? ""} />
			<PHProvider>
				<body>
					<ThemeProvider
						attribute="class"
						defaultTheme="dark"
						disableTransitionOnChange
					>
						<Suspense>
							<PostHogPageView />
						</Suspense>
						{children}
					</ThemeProvider>
					<SpeedInsights />
				</body>
			</PHProvider>
		</html>
	);
}
