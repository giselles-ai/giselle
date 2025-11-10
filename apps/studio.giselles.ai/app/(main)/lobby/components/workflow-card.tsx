"use client";

import { AppIcon } from "@giselle-internal/ui/app-icon";
import clsx from "clsx/lite";
import { Copy, Trash2 } from "lucide-react";
import Link from "next/link";

interface WorkflowCardProps {
	id: string;
	name: string;
	updatedAt: Date;
	isFeatured?: boolean;
}

export function WorkflowCard({
	id,
	name,
	updatedAt,
	isFeatured = false,
}: WorkflowCardProps) {
	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const card = e.currentTarget;
		const rect = card.getBoundingClientRect();
		card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
		card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
	};

	return (
		<div
			onMouseMove={handleMouseMove}
			className={clsx(
				"group relative flex h-[300px] w-[267px] flex-none flex-col rounded-[12px]",
				"bg-[linear-gradient(135deg,rgba(100,130,200,0.20)_0%,rgba(60,80,120,0.35)_40%,rgba(20,30,60,0.85)_100%)]",
				"filter grayscale hover:grayscale-0 transition duration-500",
			)}
			style={
				{
					"--spotlight-color": "rgba(255,255,255,0.15)",
				} as React.CSSProperties
			}
		>
			<div
				className="pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-[inherit]"
				style={{
					background:
						"radial-gradient(circle at var(--mouse-x) var(--mouse-y), var(--spotlight-color), transparent 50%)",
				}}
			/>

			{/* Top reflection line (muted) */}
			<div className="pointer-events-none absolute top-0 left-4 right-4 z-10 h-px bg-gradient-to-r from-transparent via-text/20 to-transparent" />

			{/* Subtle inner border */}
			<div className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] border-[0.5px] border-border-muted" />

			<div className="relative z-10 flex h-full w-full cursor-pointer flex-col pt-2 px-2 pb-4">
				{!isFeatured && (
					<div className="flex w-full justify-end gap-x-2">
						<button
							type="button"
							aria-label="Duplicate workflow"
							className="grid size-6 place-items-center rounded-full text-text/60 transition-colors hover:text-inverse"
						>
							<Copy className="size-4" />
						</button>
						<button
							type="button"
							aria-label="Delete workflow"
							className="grid size-6 place-items-center rounded-full text-text/60 transition-colors hover:text-error-900"
						>
							<Trash2 className="size-4" />
						</button>
					</div>
				)}
				<Link
					href={`/workflow/${id}`}
					className="flex h-full flex-col pt-2"
					prefetch={false}
				>
					<div className="aspect-video w-full rounded-lg flex items-center justify-center bg-[color-mix(in_srgb,var(--color-surface-background,_#2f343e)_20%,transparent)]">
						<AppIcon />
					</div>
					<div className="mt-3 px-2">
						<h3 className="font-sans text-[16px] font-semibold text-inverse line-clamp-2">
							{name}
						</h3>
						<div className="flex items-center justify-between mt-1">
							<span className="max-w-[200px] truncate font-geist text-xs text-text/80">
								Edited <span>{updatedAt.toLocaleDateString()}</span>
							</span>
						</div>
					</div>
				</Link>
			</div>
		</div>
	);
}
