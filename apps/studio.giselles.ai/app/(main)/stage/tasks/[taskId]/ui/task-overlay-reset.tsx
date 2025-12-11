"use client";

import { useEffect } from "react";
import { useTaskOverlayStore } from "@/app/(main)/stores/task-overlay-store";

export function TaskOverlayReset() {
	const hideOverlay = useTaskOverlayStore((state) => state.hideOverlay);

	useEffect(() => {
		hideOverlay();
	}, [hideOverlay]);

	return null;
}
