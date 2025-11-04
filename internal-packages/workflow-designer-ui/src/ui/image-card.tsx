"use client";

import { Download, ZoomIn } from "lucide-react";
import Image from "next/image";

export function ImageCard({
	src,
	onDownload,
	onZoom,
}: {
	src: string;
	onDownload: () => void;
	onZoom: () => void;
}) {
	return (
		<div className="relative group cursor-pointer flex-shrink-0 bg-[color-mix(in_srgb,var(--color-text-inverse, #fff)_10%,transparent)] rounded-[8px] overflow-hidden h-full">
			<Image
				src={src}
				alt="generated file"
				width={512}
				height={512}
				className="h-full w-auto object-contain rounded-[8px]"
			/>
			<div className="absolute inset-0 bg-background/40 rounded-[8px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-start justify-end p-2">
				<div className="flex gap-1">
					<button
						type="button"
						onClick={onDownload}
						className="p-2"
						title="Download"
					>
						<Download className="w-4 h-4 text-white hover:scale-110 hover:translate-y-[-2px] transition-transform" />
					</button>
					<button
						type="button"
						onClick={onZoom}
						className="p-2"
						title="View full size"
					>
						<ZoomIn className="w-4 h-4 text-white hover:scale-110 hover:translate-y-[-2px] transition-transform" />
					</button>
				</div>
			</div>
		</div>
	);
}
