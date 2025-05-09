import {
	type CompletedGeneration,
	type Generation,
	isCompletedGeneration,
	isFailedGeneration,
} from "@giselle-sdk/data-type";
import { useGiselleEngine } from "giselle-sdk/react";
import { Download, Loader2, ZoomIn } from "lucide-react";
import { useEffect, useState } from "react";
import { WilliIcon } from "../icons";

/**
 * Component to display placeholder during image generation
 */
function ImagePlaceholder() {
	// Simulated progress state (0-100)
	const [progress, setProgress] = useState(0);

	// Update progress over time
	useEffect(() => {
		// Initial progress from generation start (5-15%)
		setProgress(Math.floor(Math.random() * 10) + 5);

		// Gradually increase progress
		const interval = setInterval(() => {
			setProgress((prev) => {
				// Max 95% (100% only for completion)
				if (prev >= 95) {
					clearInterval(interval);
					return 95;
				}

				// Random progress speed changes (for realistic feeling)
				const increment = Math.random() * 3 + 0.5;
				return Math.min(95, prev + increment);
			});
		}, 800);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className="w-[240px] h-[240px] bg-[#BBC3D0] rounded-[8px] flex flex-col items-center justify-center">
			<WilliIcon
				className="w-[24px] h-[24px] text-[#1E67E6] animate-bounce"
				style={{ animation: "bounce 1.5s infinite ease-in-out" }}
			/>
			<div className="w-[180px] h-[4px] bg-black/40 rounded-full mt-4 overflow-hidden">
				<div
					className="h-full bg-[#1E67E6] rounded-full transition-all duration-800 ease-in-out"
					style={{ width: `${progress}%` }}
				/>
			</div>
			<p className="text-[14px] text-[#1E67E6]/80 mt-2">
				{progress < 95 ? `${Math.floor(progress)}%...` : "Almost done..."}
			</p>
		</div>
	);
}

/**
 * Lightbox component for enlarged image display
 */
function ImageLightbox({
	imageUrl,
	onClose,
}: {
	imageUrl: string;
	onClose: () => void;
}) {
	// Track original image dimensions
	const [originalSize, setOriginalSize] = useState<{
		width: number;
		height: number;
	} | null>(null);
	// Track zoom level (1 = actual size, 0.5 = half size, 2 = double size)
	const [zoomLevel, setZoomLevel] = useState<number>(1);
	// Track if we're showing actual pixels (1:1)
	const [isActualSize, setIsActualSize] = useState<boolean>(false);

	// Preload image to get dimensions
	useEffect(() => {
		const img = new Image();
		img.onload = () => {
			setOriginalSize({
				width: img.naturalWidth,
				height: img.naturalHeight,
			});
		};
		img.src = imageUrl;
	}, [imageUrl]);

	// Function to toggle between fit-to-screen and actual pixel size
	const toggleActualSize = () => {
		setIsActualSize(!isActualSize);
		setZoomLevel(1); // Reset zoom when toggling
	};

	// Increase zoom level
	const zoomIn = () => {
		setZoomLevel((prev) => Math.min(prev * 1.5, 5)); // Max 5x zoom
		setIsActualSize(true); // When manually zooming, we're in actual size mode
	};

	// Decrease zoom level
	const zoomOut = () => {
		setZoomLevel((prev) => Math.max(prev / 1.5, 0.1)); // Min 0.1x zoom
	};

	// Reset zoom to fit screen
	const resetZoom = () => {
		setZoomLevel(1);
		setIsActualSize(false);
	};

	// Handle keyboard events
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			onClose();
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center overflow-hidden"
			onClick={onClose}
			onKeyDown={handleKeyDown}
			aria-modal="true"
			role="presentation"
		>
			<div
				className="relative overflow-auto"
				style={{
					maxWidth: "90vw",
					maxHeight: "90vh",
					cursor: "move",
				}}
				onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the container
				onKeyDown={(e) => e.stopPropagation()}
			>
				{originalSize && (
					<img
						src={imageUrl}
						alt="Enlarged view"
						className={isActualSize ? "cursor-zoom-out" : "cursor-zoom-in"}
						style={{
							width: isActualSize
								? `${originalSize.width * zoomLevel}px`
								: "100%",
							height: isActualSize ? "auto" : "100%",
							objectFit: isActualSize ? "none" : "contain",
						}}
						onClick={toggleActualSize}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								toggleActualSize();
							}
						}}
					/>
				)}

				{/* Controls */}
				<div className="absolute top-[-40px] right-0 flex items-center gap-4 text-white">
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={zoomOut}
							className="p-2 hover:bg-white/10 rounded transition-colors"
							title="Zoom out"
						>
							-
						</button>
						<button
							type="button"
							onClick={resetZoom}
							className="p-2 hover:bg-white/10 rounded transition-colors"
							title={isActualSize ? "Fit to screen" : "Actual size"}
						>
							{Math.round(zoomLevel * 100)}%
						</button>
						<button
							type="button"
							onClick={zoomIn}
							className="p-2 hover:bg-white/10 rounded transition-colors"
							title="Zoom in"
						>
							+
						</button>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-2 text-white bg-black/30 hover:bg-black/50 rounded-full transition-colors w-[30px] h-[30px] flex items-center justify-center"
						title="Close"
					>
						<span className="text-xl font-bold">✕</span>
					</button>
				</div>

				{/* Image size info */}
				{originalSize && (
					<div className="absolute bottom-[-30px] left-0 text-white text-sm opacity-70">
						{originalSize.width} × {originalSize.height}px
					</div>
				)}
			</div>
		</div>
	);
}

/**
 * Display component for image generation
 */
export function ImageGenerationView({
	generation,
}: {
	generation: Generation;
}) {
	const client = useGiselleEngine();
	const [lightboxImage, setLightboxImage] = useState<string | null>(null);
	// Download state management
	const [downloadingImages, setDownloadingImages] = useState<
		Record<string, boolean>
	>({});

	// Display error message
	if (isFailedGeneration(generation)) {
		return <div className="text-red-500">{generation.error.message}</div>;
	}

	// Image download handling
	const downloadImage = async (pathname: string, filename: string) => {
		try {
			// Set download start state
			setDownloadingImages((prev) => ({ ...prev, [filename]: true }));

			// Get full image URL
			const imageUrl = `${client.basePath}/${pathname}`;

			// Use fetch to get image as blob for better performance
			const response = await fetch(imageUrl);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch image: ${response.status} ${response.statusText}`,
				);
			}

			// Get image as blob
			const blob = await response.blob();

			// Create blob URL
			const url = URL.createObjectURL(blob);

			// Create and trigger download
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();

			// Clean up
			setTimeout(() => {
				URL.revokeObjectURL(url);
				document.body.removeChild(a);
			}, 100);
		} catch (error) {
			console.error("Download failed:", error);
		} finally {
			// Short delay before changing download state to avoid UI flicker
			setTimeout(() => {
				setDownloadingImages((prev) => ({ ...prev, [filename]: false }));
			}, 500);
		}
	};

	// Show placeholders when generation is not completed
	if (!isCompletedGeneration(generation)) {
		// Get expected number of images from node settings
		// default: 1 image
		const expectedImageCount =
			generation.context.operationNode.content.llm?.configurations?.n || 1;

		return (
			<div className="flex gap-[12px] overflow-x-auto pb-2">
				{Array.from({ length: expectedImageCount }).map((_, index) => (
					<ImagePlaceholder key={`placeholder-${generation.id}-${index}`} />
				))}
			</div>
		);
	}

	// Display completed generation results
	return (
		<>
			<div className="flex gap-[12px] overflow-x-auto pb-2">
				{generation.outputs.map((output) => {
					if (output.type !== "generated-image") {
						return null;
					}

					return (
						<div key={output.outputId} className="flex gap-[12px]">
							{output.contents.map((content) => {
								const imageUrl = `${client.basePath}/${content.pathname}`;
								const isDownloading = downloadingImages[content.filename];

								return (
									<div
										key={content.filename}
										className="relative w-[240px] flex-shrink-0 group"
									>
										<img
											src={imageUrl}
											alt="Generated content"
											className="w-full h-auto rounded-[8px] cursor-pointer"
											onClick={() => setLightboxImage(imageUrl)}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													setLightboxImage(imageUrl);
												}
											}}
										/>
										{/* Black overlay - shown on hover */}
										<div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 rounded-[8px]" />
										<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-0.5 z-10">
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													downloadImage(content.pathname, content.filename);
												}}
												className="p-2 text-white hover:text-white/80 transition-all hover:-translate-y-0.5 duration-200 disabled:opacity-50 disabled:hover:translate-y-0"
												title="Download image"
												disabled={isDownloading}
											>
												{isDownloading ? (
													<Loader2 className="w-4 h-4 animate-spin" />
												) : (
													<Download className="w-4 h-4" />
												)}
											</button>
											<button
												type="button"
												onClick={() => setLightboxImage(imageUrl)}
												className="p-2 text-white hover:text-white/80 transition-all hover:-translate-y-0.5 duration-200"
												title="Enlarge image"
											>
												<ZoomIn className="w-4 h-4" />
											</button>
										</div>
									</div>
								);
							})}
						</div>
					);
				})}
			</div>

			{/* Lightbox display */}
			{lightboxImage && (
				<ImageLightbox
					imageUrl={lightboxImage}
					onClose={() => setLightboxImage(null)}
				/>
			)}
		</>
	);
}
