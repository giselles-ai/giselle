"use client";

import { X } from "lucide-react";
import { createPortal } from "react-dom";

export function Lightbox({
	src,
	onClose,
}: {
	src: string;
	onClose: () => void;
}) {
	if (typeof document === "undefined") return null;
	return createPortal(
		<div
			role="dialog"
			aria-label="Image viewer"
			className="fixed inset-0 bg-background/95 z-[9999] flex items-center justify-center cursor-pointer"
			onClick={onClose}
			onKeyDown={(e) => {
				if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
					onClose();
				}
			}}
		>
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					onClose();
				}}
				className="absolute top-4 right-4 z-10 p-3 text-white hover:bg-bg/20 rounded-full transition-colors"
				title="Close (ESC)"
			>
				<X className="w-6 h-6" />
			</button>
			<img
				src={src}
				alt="Generated content"
				className="max-w-[95vw] max-h-[95vh] object-contain"
			/>
		</div>,
		document.body,
	);
}
