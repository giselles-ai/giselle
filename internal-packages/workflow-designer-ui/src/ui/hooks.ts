"use client";

import { useWorkflowDesignerStore } from "@giselle-sdk/giselle/react";
import { useEffect, useState } from "react";

export function useLivePrompt(nodeId: string) {
	return useWorkflowDesignerStore((s) => {
		const n = s.workspace.nodes.find((x) => x.id === nodeId);
		return (n?.content as { prompt?: string } | undefined)?.prompt;
	});
}

export function useOverlayBottom(ref: React.RefObject<HTMLElement>) {
	const [overlayBottomPx, setOverlayBottomPx] = useState(0);

	useEffect(() => {
		const el = ref.current;
		if (!el) {
			setOverlayBottomPx(0);
			return;
		}
		const update = () => setOverlayBottomPx(el.offsetHeight || 0);
		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);
		window.addEventListener("resize", update);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", update);
		};
	}, [ref]);

	return overlayBottomPx;
}

export function useElementTopPx(ref: React.RefObject<HTMLElement>) {
	const [topPx, setTopPx] = useState(0);

	useEffect(() => {
		const el = ref.current;
		if (!el) {
			setTopPx(0);
			return;
		}
		const update = () => {
			const rect = el.getBoundingClientRect();
			const container = el.closest(".relative") as HTMLElement | null;
			const containerRect = container?.getBoundingClientRect();
			setTopPx(containerRect ? rect.top - containerRect.top : 0);
		};
		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);
		window.addEventListener("resize", update);
		window.addEventListener("scroll", update, true);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", update);
			window.removeEventListener("scroll", update, true);
		};
	}, [ref]);

	return topPx;
}
