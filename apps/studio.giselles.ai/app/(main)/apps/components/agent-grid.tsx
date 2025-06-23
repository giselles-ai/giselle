"use client";

import type { AgentId } from "@/services/agents";
import { useEffect, useRef } from "react";
import { AgentCard } from "./agent-card";
import { createQuickSetter } from "./utils";

type AgentGridProps = {
	agents: {
		id: AgentId;
		name: string | null;
		updatedAt: Date;
		workspaceId: string | null;
	}[];
};

export const AgentGrid = ({ agents }: AgentGridProps) => {
	const rootRef = useRef<HTMLDivElement>(null);
	const fadeRef = useRef<HTMLDivElement>(null);
	const pos = useRef({ x: 0, y: 0 });
	// quickSetter returns a function like (value: number) => void
	const setX = useRef<((value: number) => void) | null>(null);
	const setY = useRef<((value: number) => void) | null>(null);
	const animId = useRef<number | null>(null);

	useEffect(() => {
		const el = rootRef.current;
		if (!el) return;
		setX.current = createQuickSetter(el, "--x");
		setY.current = createQuickSetter(el, "--y");
		const { width, height } = el.getBoundingClientRect();
		pos.current = { x: width / 2, y: height / 2 };
		if (setX.current && setY.current) {
			setX.current(pos.current.x);
			setY.current(pos.current.y);
		}

		return () => {
			if (animId.current !== null) cancelAnimationFrame(animId.current);
			setX.current = null;
			setY.current = null;
		};
	}, []);

	const animatePos = (targetX: number, targetY: number, duration = 450) => {
		if (animId.current !== null) cancelAnimationFrame(animId.current);
		const startX = pos.current.x;
		const startY = pos.current.y;
		const startTime = performance.now();

		const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

		const step = (now: number) => {
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const eased = easeOutCubic(progress);

			pos.current.x = startX + (targetX - startX) * eased;
			pos.current.y = startY + (targetY - startY) * eased;

			if (setX.current && setY.current) {
				setX.current(pos.current.x);
				setY.current(pos.current.y);
			}

			if (progress < 1) {
				animId.current = requestAnimationFrame(step);
			}
		};

		animId.current = requestAnimationFrame(step);
	};

	const fadeTo = (opacity: number, duration = 250) => {
		if (!fadeRef.current) return;
		fadeRef.current.style.transition = `opacity ${duration}ms ease`; // apply transition
		fadeRef.current.style.opacity = String(opacity);
	};

	const handleMove = (e: React.PointerEvent) => {
		if (!rootRef.current) return;
		const r = rootRef.current.getBoundingClientRect();
		animatePos(e.clientX - r.left, e.clientY - r.top);
		fadeTo(0, 250);
	};

	const handleLeave = () => {
		fadeTo(1, 600);
	};

	return (
		<div
			ref={rootRef}
			onPointerMove={handleMove}
			onPointerLeave={handleLeave}
			className="relative flex h-full w-full flex-wrap items-start justify-start gap-4"
			style={
				{
					"--r": "400px",
					"--x": "50%",
					"--y": "50%",
				} as React.CSSProperties
			}
		>
			{agents.map((agent) => (
				<AgentCard key={agent.id} agent={agent} />
			))}
			<div
				className="pointer-events-none absolute inset-0 z-30"
				style={{
					backdropFilter: "grayscale(1) brightness(0.78)",
					WebkitBackdropFilter: "grayscale(1) brightness(0.78)",
					background: "rgba(0,0,0,0.001)",
					maskImage:
						"radial-gradient(circle var(--r) at var(--x) var(--y),transparent 0%,transparent 15%,rgba(0,0,0,0.10) 30%,rgba(0,0,0,0.22)45%,rgba(0,0,0,0.35)60%,rgba(0,0,0,0.50)75%,rgba(0,0,0,0.68)88%,white 100%)",
					WebkitMaskImage:
						"radial-gradient(circle var(--r) at var(--x) var(--y),transparent 0%,transparent 15%,rgba(0,0,0,0.10) 30%,rgba(0,0,0,0.22)45%,rgba(0,0,0,0.35)60%,rgba(0,0,0,0.50)75%,rgba(0,0,0,0.68)88%,white 100%)",
				}}
			/>
			<div
				ref={fadeRef}
				className="pointer-events-none absolute inset-0 z-40 transition-opacity duration-[250ms]"
				style={{
					backdropFilter: "grayscale(1) brightness(0.78)",
					WebkitBackdropFilter: "grayscale(1) brightness(0.78)",
					background: "rgba(0,0,0,0.001)",
					maskImage:
						"radial-gradient(circle var(--r) at var(--x) var(--y),white 0%,white 15%,rgba(255,255,255,0.90)30%,rgba(255,255,255,0.78)45%,rgba(255,255,255,0.65)60%,rgba(255,255,255,0.50)75%,rgba(255,255,255,0.32)88%,transparent 100%)",
					WebkitMaskImage:
						"radial-gradient(circle var(--r) at var(--x) var(--y),white 0%,white 15%,rgba(255,255,255,0.90)30%,rgba(255,255,255,0.78)45%,rgba(255,255,255,0.65)60%,rgba(255,255,255,0.50)75%,rgba(255,255,255,0.32)88%,transparent 100%)",
					opacity: 1,
				}}
			/>
		</div>
	);
};
