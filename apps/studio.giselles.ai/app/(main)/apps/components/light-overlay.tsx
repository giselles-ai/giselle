"use client";

import { BACKDROP_STYLES, MASK_GRADIENTS } from "./constants";

type LightOverlayProps = {
	fadeRef?: React.RefObject<HTMLDivElement | null>;
};

export function LightTrackingOverlay({ fadeRef }: LightOverlayProps) {
	return (
		<>
			<div
				className="pointer-events-none absolute inset-0 z-30"
				style={{
					backdropFilter: BACKDROP_STYLES.filter,
					WebkitBackdropFilter: BACKDROP_STYLES.filter,
					background: BACKDROP_STYLES.background,
					transform: BACKDROP_STYLES.transform,
					willChange: "mask-image",
					maskImage: MASK_GRADIENTS.dark,
					WebkitMaskImage: MASK_GRADIENTS.dark,
				}}
			/>
			<div
				ref={fadeRef}
				className="pointer-events-none absolute inset-0 z-40 transition-opacity duration-[250ms]"
				style={{
					backdropFilter: BACKDROP_STYLES.filter,
					WebkitBackdropFilter: BACKDROP_STYLES.filter,
					background: BACKDROP_STYLES.background,
					transform: BACKDROP_STYLES.transform,
					willChange: "mask-image, opacity",
					maskImage: MASK_GRADIENTS.light,
					WebkitMaskImage: MASK_GRADIENTS.light,
					opacity: 1,
				}}
			/>
		</>
	);
}
