import { Hubot_Sans, Roboto_Serif } from "next/font/google";
/**
 * Since the Rosart font is a proprietary font, use an alternative font during OSS development.
 */
export const rosart = Roboto_Serif({
	variable: "--font-rosart",
	subsets: ["latin"],
});

export const hubotSans = Hubot_Sans({
	variable: "--font-hubot-sans",
	subsets: ["latin"],
});
