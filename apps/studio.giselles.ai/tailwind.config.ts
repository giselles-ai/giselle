import typographyPlugin from "@tailwindcss/typography";
import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

const config = {
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
		"./services/**/*.{ts,tsx}",
		"./packages/**/*.{ts,tsx}",
		"!./node_modules",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			fontFamily: {
				sans: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
			},
			colors: {
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
					900: "hsl(var(--primary_900))",
					400: "hsl(var(--primary_400))",
					200: "hsl(var(--primary_200))",
					100: "hsl(var(--primary_100))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
				error: {
					900: "hsl(var(--error_900))",
				},
				warning: {
					900: "hsl(var(--warning_900))",
				},
				black: {
					900: "hsl(var(--black_900))",
					850: "hsl(var(--black_850))",
					820: "hsl(var(--black_820))",
					800: "hsl(var(--black_800))",
					600: "hsl(var(--black_600))",
					400: "hsl(var(--black_400))",
					350: "hsl(var(--black_350))",
					300: "hsl(var(--black_300))",
					250: "hsl(var(--black_250))",
					100: "hsl(var(--black_100))",
					80: "hsl(var(--black_80))",
					70: "hsl(var(--black_70))",
					50: "hsl(var(--black_50))",
					40: "hsl(var(--black_40))",
					30: "hsl(var(--black_30))",
					"-30": "hsl(var(--black_-30))",
					"-50": "hsl(var(--black_-50))",
					"-70": "hsl(var(--black_-70))",
				},
				white: {
					DEFAULT: "hsl(var(--white))",
					900: "hsl(var(--white_900))",
					850: "hsl(var(--white_850))",
					800: "hsl(var(--white_800))",
					400: "hsl(var(--white_400))",
					350: "hsl(var(--white_350))",
					30: "hsl(var(--white_30))",
				},
				green: {
					DEFAULT: "hsl(var(--green))",
				},
				red: {
					900: "hsl(var(--red_900))",
					400: "hsl(var(--red_400))",
					300: "hsl(var(--red_300))",
					200: "hsl(var(--red_200))",
					50: "hsl(var(--red_50))",
				},
				blue: {
					80: "hsl(var(--blue_80))",
				},
				"github-node-1": "var(--color-github-node-1)",
				"github-node-2": "var(--color-github-node-2)",
				"trigger-node-1": "var(--color-trigger-node-1)",
				"trigger-node-2": "var(--color-trigger-node-2)",
				"action-node-1": "var(--color-action-node-1)",
				"action-node-2": "var(--color-action-node-2)",
				"query-node-1": "var(--color-query-node-1)",
				"query-node-2": "var(--color-query-node-2)",
				"text-node-1": "var(--color-text-node-1)",
				"text-node-2": "var(--color-text-node-2)",
				"file-node-1": "var(--color-file-node-1)",
				"file-node-2": "var(--color-file-node-2)",
				"webPage-node-1": "var(--color-webPage-node-1)",
				"webPage-node-2": "var(--color-webPage-node-2)",
				"generation-node-1": "var(--color-generation-node-1)",
				"generation-node-2": "var(--color-generation-node-2)",
				"image-generation-node-1": "var(--color-image-generation-node-1)",
				"image-generation-node-2": "var(--color-image-generation-node-2)",
				"audio-generation-node-1": "var(--color-audio-generation-node-1)",
				"audio-generation-node-2": "var(--color-audio-generation-node-2)",
				"video-generation-node-1": "var(--color-video-generation-node-1)",
				"video-generation-node-2": "var(--color-video-generation-node-2)",
				"web-search-node-1": "var(--color-web-search-node-1)",
				"web-search-node-2": "var(--color-web-search-node-2)",
				"vector-store-node-1": "var(--color-vector-store-node-1)",
				"vector-store-node-2": "var(--color-vector-store-node-2)",
				"node-data-900": "var(--color-node-data-900)",
				"node-plaintext-900": "var(--color-node-plaintext-900)",
				rosepine: {
					base: "hsl(var(--rosepine_base))",
					surface: "hsl(var(--rosepine_surface))",
					overlay: "hsl(var(--rosepine_overlay))",
					muted: "hsl(var(--rosepine_muted))",
					subtle: "hsl(var(--rosepine_subtle))",
					text: "hsl(var(--rosepine_text))",
					love: "hsl(var(--rosepine_love))",
					gold: "hsl(var(--rosepine_gold))",
					rose: "hsl(var(--rosepine_rose))",
					pine: "hsl(var(--rosepine_pine))",
					foam: "hsl(var(--rosepine_foam))",
					iris: "hsl(var(--rosepine_iris))",
					highlightLow: "hsl(var(--rosepine_highlightLow))",
					highlightMed: "hsl(var(--rosepine_highlightMed))",
					highlightHigh: "hsl(var(--rosepine_highlightHigh))",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			boxShadow: {
				"trigger-node-1": "var(--shadow-trigger-node-1)",
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
				"caret-blink": {
					"0%,70%,100%": { opacity: "1" },
					"20%,50%": { opacity: "0" },
				},
				"follow-through-overlap-spin": {
					"0%": { transform: "rotate(0deg)" },
					"40%": { transform: "rotate(-400deg)" },
					"60%": { transform: "rotate(-300deg)" },
					"80%": { transform: "rotate(-370deg)" },
					"100%": { transform: "rotate(-360deg)" },
				},
				"pop-pop": {
					"0%": {
						transform: "translateY(0)",
						fill: "hsl(var(--black_40))",
					},
					"33.3333%": {
						transform: "translateY(-4px)",
						fill: "hsl(var(--black_30))",
					},
					"44.4444%": {
						transform: "translateY(0px)",
						fill: "hsl(var(--black_40))",
					},
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"caret-blink": "caret-blink 1.25s ease-out infinite",
				"follow-through-spin":
					"follow-through-overlap-spin 1.75s ease-out infinite",
				"ticktock-bounce": "ticktock-bounce 1.5s steps(2, jump-none) infinite",
			},
		},
	},
	plugins: [animatePlugin, typographyPlugin],
} satisfies Config;

export default config;
