import { useEffect, useState } from "react";

const gridWidth = "0.3px";
const gridSize = 22;
const ellipseSize = 4;

export function Background() {
	const [intersections, setIntersections] = useState<
		{ x: number; y: number }[]
	>([]);

	useEffect(() => {
		// Calculate grid dimensions based on container size
		const calculateIntersections = () => {
			const container = document.getElementById("grid-container");
			if (!container) return;

			const width = container.clientWidth;
			const height = container.clientHeight;

			const horizontalLines = Math.floor(height / gridSize) + 1;
			const verticalLines = Math.floor(width / gridSize) + 1;

			const points: { x: number; y: number }[] = [];

			// Calculate all intersection points
			for (let y = 0; y < horizontalLines; y++) {
				for (let x = 0; x < verticalLines; x++) {
					points.push({
						x: x * gridSize,
						y: y * gridSize,
					});
				}
			}

			setIntersections(points);
		};

		calculateIntersections();
		window.addEventListener("resize", calculateIntersections);

		return () => {
			window.removeEventListener("resize", calculateIntersections);
		};
	}, []);

	return (
		<div className="relative w-full h-full">
			<div
				id="grid-container"
				className="absolute inset-0"
				style={{
					backgroundImage: `
          linear-gradient(to right, hsl(from var(--color-white-950) h s l / 0.3) ${gridWidth}, transparent ${gridWidth}),
                        linear-gradient(to bottom, hsl(from var(--color-white-950) h s l / 0.3) ${gridWidth}, transparent ${gridWidth})
          `,
					backgroundSize: `${gridSize}px ${gridSize}px`,
				}}
			>
				{intersections.map((point, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: for internal use
						key={index}
						className="absolute bg-white-950/30 rounded-full transform -translate-x-1/2 -translate-y-1/2"
						style={{
							width: `${ellipseSize}px`,
							height: `${ellipseSize}px`,
							left: `${point.x}px`,
							top: `${point.y}px`,
						}}
					/>
				))}
			</div>

			<div className="absolute w-full h-full bg-radial-[31.95%_31.95%_at_50%_50%] from-[rgba(1,4,26,0.20)] to-[rgba(1,4,26,0.80)] w-full h-full" />
		</div>
	);
}
