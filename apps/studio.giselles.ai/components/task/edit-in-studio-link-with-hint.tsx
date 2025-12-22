"use client";

import { StatusBadge } from "@giselle-internal/ui/status-badge";
import type { WorkspaceId } from "@giselles-ai/protocol";
import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

const IDLE_HINT_DELAY_MS = 8000;
const TASK_EDIT_IN_STUDIO_HINT_SHOWN_KEY =
	"giselle:tasks:editInStudioHintShown";

function IdleHintArrow({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			width="77"
			height="127"
			viewBox="0 0 77 127"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path
				d="M76.1042 19.8128C76.0142 15.4228 75.7242 10.9328 74.4342 6.70278C73.7942 4.59278 72.8942 2.57278 71.7242 0.70278C70.7042 -0.92722 68.1042 0.57278 69.1342 2.21278C73.5042 9.19278 73.1742 17.9128 73.1542 25.8428C73.1342 33.6228 72.5742 41.6928 67.9042 48.2128C63.9642 53.7128 57.9742 58.1928 51.6442 60.5628C51.0242 60.7928 50.3942 61.0028 49.7542 61.1928C49.8142 57.2328 49.7342 53.2428 49.4442 49.3128C49.1642 45.6428 48.5842 41.8528 46.7942 38.5828C45.0842 35.4528 42.1142 33.0028 38.5442 32.4028C34.9242 31.7928 31.1242 32.7628 28.2042 34.9828C21.7242 39.9128 21.4842 49.7528 25.9542 56.1028C30.3042 62.2828 38.3942 65.9428 45.9142 65.0528C46.1542 65.0228 46.3942 64.9828 46.6342 64.9528C46.2242 71.9128 44.7642 78.6428 40.9842 84.7228C38.7142 88.3728 35.9542 91.6728 33.1942 94.9628C30.7642 97.8628 28.3042 100.743 25.7142 103.503C20.6042 108.933 14.8342 114.093 7.86415 116.963C7.57415 117.083 7.27415 117.193 6.97415 117.303C9.59415 113.043 12.6742 109.073 16.1742 105.463C17.5142 104.073 15.4042 101.953 14.0542 103.343C9.63415 107.903 5.83415 113.033 2.76415 118.573C2.74415 118.573 2.71415 118.583 2.69415 118.593C1.69415 118.823 1.45415 119.763 1.73415 120.513C1.18415 121.583 0.644152 122.673 0.154152 123.773C-0.445848 125.093 0.804152 126.593 2.20415 125.823C8.80415 122.223 16.5242 120.763 23.9842 121.823C24.7942 121.933 25.5842 121.623 25.8342 120.773C26.0342 120.073 25.5842 119.043 24.7842 118.923C17.9442 117.953 11.0342 118.783 4.69415 121.343C4.72415 121.273 4.76415 121.213 4.79415 121.143C12.3642 119.053 18.8742 114.413 24.4842 109.013C27.5042 106.103 30.3042 102.973 33.0342 99.7828C35.9942 96.3228 38.9742 92.8528 41.6242 89.1528C44.3242 85.3728 46.5242 81.2828 47.8242 76.8128C49.0042 72.7628 49.5042 68.5328 49.6942 64.3228C55.7542 62.7428 61.3642 59.2428 65.8642 55.0128C68.5042 52.5328 70.8942 49.6428 72.5342 46.4028C74.5542 42.4128 75.4542 37.9828 75.8642 33.5628C76.2842 29.0028 76.2142 24.3828 76.1142 19.8128H76.1042ZM42.3742 62.1628C38.9942 61.9428 35.5942 60.5928 32.8042 58.7028C26.8942 54.7128 23.6042 46.4728 27.6042 39.9828C31.0242 34.4428 39.6042 33.3728 43.4942 38.9628C45.4042 41.7028 46.0542 45.1628 46.3542 48.4228C46.7142 52.3228 46.7542 56.2828 46.7542 60.1928C46.7542 60.7628 46.7542 61.3428 46.7342 61.9128C45.2942 62.1528 43.8342 62.2628 42.3642 62.1628H42.3742Z"
				fill="currentColor"
			/>
		</svg>
	);
}

export function EditInStudioLinkWithHint({
	workspaceId,
	leftIcon,
	label = "Edit in Studio",
	hintText,
}: {
	workspaceId: WorkspaceId;
	leftIcon: ReactNode;
	label?: string;
	hintText?: string;
}) {
	const [lastInteractionAt, setLastInteractionAt] = useState(() => Date.now());
	const [hasShownOnce, setHasShownOnce] = useState(false);
	const [shouldBeVisible, setShouldBeVisible] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const [hasShownEver, setHasShownEver] = useState(false);

	useEffect(() => {
		try {
			setHasShownEver(
				Boolean(
					window.localStorage.getItem(TASK_EDIT_IN_STUDIO_HINT_SHOWN_KEY),
				),
			);
		} catch {
			// localStorage might be unavailable (privacy mode). In that case, disable the hint.
			setHasShownEver(true);
		}
	}, []);

	const markInteraction = useCallback(() => {
		setShouldBeVisible(false);
		setLastInteractionAt(Date.now());
	}, []);

	useEffect(() => {
		if (hasShownOnce || hasShownEver) return;
		const timeout = window.setTimeout(() => {
			if (Date.now() - lastInteractionAt < IDLE_HINT_DELAY_MS) return;
			setHasShownOnce(true);
			try {
				window.localStorage.setItem(TASK_EDIT_IN_STUDIO_HINT_SHOWN_KEY, "1");
				setHasShownEver(true);
			} catch {
				// ignore
			}
			setShouldBeVisible(true);
		}, IDLE_HINT_DELAY_MS);

		return () => window.clearTimeout(timeout);
	}, [hasShownEver, hasShownOnce, lastInteractionAt]);

	// Stabilize fade-in (avoid "pop" on show).
	useEffect(() => {
		if (!shouldBeVisible) {
			setIsVisible(false);
			return;
		}
		const raf = window.requestAnimationFrame(() => setIsVisible(true));
		return () => window.cancelAnimationFrame(raf);
	}, [shouldBeVisible]);

	useEffect(() => {
		// Any interaction on the page should dismiss the hint immediately.
		window.addEventListener("keydown", markInteraction, { capture: true });
		window.addEventListener("focusin", markInteraction, { capture: true });
		return () => {
			window.removeEventListener("keydown", markInteraction, { capture: true });
			window.removeEventListener("focusin", markInteraction, { capture: true });
		};
	}, [markInteraction]);

	return (
		<div className="relative inline-block">
			<Link
				href={`/workspaces/${workspaceId}`}
				className="inline-block"
				target="_blank"
				rel="noreferrer"
				onClick={markInteraction}
			>
				<div className="group [&>div]:rounded-lg [&>div>div]:rounded-md [&>div>div]:text-[hsl(192,73%,84%)] [&>div>div]:border-[hsl(192,73%,84%)] [&>div>div]:transition-colors [&>div>div]:cursor-pointer hover:[&>div>div]:bg-[hsl(192,73%,84%)] hover:[&>div>div]:text-[hsl(192,73%,20%)]">
					<StatusBadge status="warning" variant="default" leftIcon={leftIcon}>
						{label}
					</StatusBadge>
				</div>
			</Link>

			{/* Hint element (text TBD) */}
			<div
				className={clsx(
					"pointer-events-none absolute right-[-18px] top-[-14px] z-10 flex flex-col items-start text-left text-[#B8E8F4] origin-top-right rotate-[-20deg] translate-x-[105px] translate-y-[-15px] transition-opacity duration-300 ease-out",
					isVisible ? "opacity-100" : "opacity-0",
				)}
				aria-hidden="true"
			>
				<IdleHintArrow
					className={clsx(
						"h-[44px] w-[44px] rotate-180 -scale-x-100",
						hintText ? "mb-2" : "",
					)}
				/>
				{hintText ? (
					<span className="text-[12px] font-mono tracking-[0.02em]">
						{hintText}
					</span>
				) : null}
			</div>
		</div>
	);
}
