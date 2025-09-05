"use client";

import type { ImageGenerationLanguageModelData } from "@giselle-sdk/data-type";
import { WilliIcon } from "../icons";

interface ImageGenerationLoadingProps {
	configuration: ImageGenerationLanguageModelData;
	duration?: string;
}

function getAspectRatio(
	configuration: ImageGenerationLanguageModelData,
): string {
	if (configuration.provider === "fal") {
		const size = configuration.configurations.size;
		switch (size) {
			case "1152x864":
				return "1152/864";
			case "1312x736":
				return "1312/736";
			case "512x512":
				return "512/512";
			case "1024x1024":
				return "1024/1024";
			default:
				return "1024/1024";
		}
	}

	if (configuration.provider === "openai") {
		const size = configuration.configurations.size;

		// Parse exact dimensions from WIDTHxHEIGHT format
		if (typeof size === "string" && size.includes("x")) {
			const [widthStr, heightStr] = size.split("x");
			const width = parseInt(widthStr, 10);
			const height = parseInt(heightStr, 10);

			if (!Number.isNaN(width) && !Number.isNaN(height) && height > 0) {
				return `${width}/${height}`;
			}
		}

		// Fallback to hardcoded values for any non-standard formats
		return "1/1";
	}

	return "1/1";
}

export function ImageGenerationLoading({
	configuration,
	duration,
}: ImageGenerationLoadingProps) {
	const aspectRatio = getAspectRatio(configuration);

	return (
		<div
			className="bg-white-900/10 rounded-[8px] flex items-center justify-center text-white-400 relative overflow-hidden h-full"
			style={{
				aspectRatio,
				width: "auto",
			}}
		>
			<div
				className="absolute inset-0 opacity-30"
				style={{
					background:
						"linear-gradient(-45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)",
					animation: "glare 3s ease-in-out infinite",
					transform: "translateX(-100%)",
				}}
			/>
			<style jsx>{`
        @keyframes glare {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        @keyframes shine {
          0% {
            background-position: 100%;
          }
          100% {
            background-position: -100%;
          }
        }
        @keyframes ghost-glow {
          0%,
          60%,
          100% {
            opacity: 0.4;
            filter: brightness(1);
          }
          80% {
            opacity: 1;
            filter: brightness(1.8)
              drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
          }
        }
      `}</style>
			<div className="flex items-center gap-[4px] absolute top-[12px] left-[12px] text-white-400">
				<p
					className="text-[13px] font-medium bg-clip-text text-transparent animate-[shine_3s_linear_infinite]"
					style={{
						backgroundImage:
							"linear-gradient(120deg, rgba(255, 255, 255, 0.4) 40%, rgba(255, 255, 255, 1) 50%, rgba(255, 255, 255, 0.4) 60%)",
						backgroundSize: "200% 100%",
						WebkitBackgroundClip: "text",
					}}
				>
					Generating...{duration && ` (${duration})`}
				</p>
				<WilliIcon
					className="w-[18px] h-[18px]"
					style={{ animation: "ghost-glow 3s ease-in-out infinite" }}
				/>
				<WilliIcon
					className="w-[18px] h-[18px]"
					style={{ animation: "ghost-glow 3s ease-in-out infinite 0.5s" }}
				/>
				<WilliIcon
					className="w-[18px] h-[18px]"
					style={{ animation: "ghost-glow 3s ease-in-out infinite 1s" }}
				/>
			</div>
		</div>
	);
}
