import { useEffect, useState } from "react";
import { WilliIcon } from "../icons";
import GlareHover from "./glare-hover";

/**
 * Placeholder component displayed during generation processes
 * Shows animated icon, progress bar, elapsed time, and glare effect
 */
export function GeneratingPlaceholder({
	width = "100%",
	height = "240px",
	glareColor = "#ffffff",
	className = "",
}: {
	width?: string;
	height?: string;
	glareColor?: string;
	className?: string;
}) {
	// Track elapsed time in seconds
	const [elapsedSeconds, setElapsedSeconds] = useState(0);

	// Update elapsed time every second
	useEffect(() => {
		const interval = setInterval(() => {
			setElapsedSeconds((prev) => prev + 1);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	return (
		<GlareHover
			autoAnimate={true}
			loop={true}
			glareColor={glareColor}
			glareOpacity={0.3}
			transitionDuration={800}
			width={width}
			height={height}
			background="rgba(255, 255, 255, 0.05)" // white-900/5
			borderRadius="8px"
			borderColor="transparent"
			className={`flex items-center justify-center ${className}`}
		>
			<div className="flex flex-col items-center gap-1">
				<WilliIcon
					className="w-[24px] h-[24px] animate-bounce text-white-800"
					style={{
						animation: "bounce 1.5s infinite ease-in-out",
					}}
				/>
				<p className="text-[14px] text-white-800/80">
					Generating... ({elapsedSeconds}s)
				</p>
			</div>
		</GlareHover>
	);
}
