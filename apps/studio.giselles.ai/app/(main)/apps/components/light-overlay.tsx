"use client";

import type { CSSProperties } from "react";
import { BACKDROP_STYLES, MASK_GRADIENTS, Z_INDEX } from "./constants";

type LightOverlayProps = {
	fadeRef?: React.RefObject<HTMLDivElement | null>;
};

const createOverlayStyle = (
	maskImage: string,
	willChange: string,
	_zIndex: number,
	additionalStyles?: CSSProperties,
): CSSProperties => ({
	backdropFilter: BACKDROP_STYLES.filter,
	WebkitBackdropFilter: BACKDROP_STYLES.filter,
	background: BACKDROP_STYLES.background,
	transform: BACKDROP_STYLES.transform,
	willChange,
	maskImage,
	WebkitMaskImage: maskImage,
	...additionalStyles,
});

export function DarkOverlay() {
	return (
		<div
			className={`pointer-events-none absolute inset-0 z-${Z_INDEX.darkLayer}`}
			style={createOverlayStyle(
				MASK_GRADIENTS.dark,
				"mask-image",
				Z_INDEX.darkLayer,
			)}
		/>
	);
}

export function LightOverlay({ fadeRef }: LightOverlayProps) {
	return (
		<div
			ref={fadeRef}
			className={`pointer-events-none absolute inset-0 z-${Z_INDEX.lightLayer} transition-opacity duration-[250ms]`}
			style={createOverlayStyle(
				MASK_GRADIENTS.light,
				"mask-image, opacity",
				Z_INDEX.lightLayer,
				{ opacity: 1 },
			)}
		/>
	);
}

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
