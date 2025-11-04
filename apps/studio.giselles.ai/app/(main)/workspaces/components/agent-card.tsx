"use client";

import { formatTimestamp } from "@giselles-ai/lib/utils";
import clsx from "clsx/lite";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { agents as dbAgents } from "@/db";
import { AppThumbnail } from "./app-thumbnail";
import { DeleteAgentButton } from "./delete-agent-button";
import { DuplicateAgentButton } from "./duplicate-agent-button";

export function AgentCard({ agent }: { agent: typeof dbAgents.$inferSelect }) {
	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const card = e.currentTarget;
		const rect = card.getBoundingClientRect();
		card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
		card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
	};

	const [relativeTime, setRelativeTime] = useState("");

	useEffect(() => {
		const update = () => {
			setRelativeTime(
				formatTimestamp.toRelativeTime(new Date(agent.updatedAt).getTime()),
			);
		};
		update();
		const id = setInterval(update, 60_000);
		return () => clearInterval(id);
	}, [agent.updatedAt]);

	if (!agent.workspaceId) {
		return null;
	}

	return (
		<section
			onMouseMove={handleMouseMove}
			aria-label={agent.name || "Untitled workspace"}
			className={clsx(
				"group relative flex h-[300px] w-[267px] flex-none flex-col rounded-[12px] border-[0.5px]",
				"filter grayscale hover:grayscale-0 transition duration-500",
			)}
			style={
				{
					"--spotlight-color": "var(--color-agent-card-spotlight)",
					borderColor: "var(--color-agent-card-border)",
					background:
						"linear-gradient(135deg, var(--color-agent-card-gradient-from) 0%, var(--color-agent-card-gradient-middle) 40%, var(--color-agent-card-gradient-to) 100%)",
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

			{/* Top reflection line */}
			<div className="pointer-events-none absolute top-0 left-4 right-4 z-10 h-px bg-gradient-to-r from-transparent via-text/40 to-transparent" />

			{/* Subtle inner border */}
			<div className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] border-[0.5px] border-border-muted" />

			<div className="relative z-10 flex h-full w-full cursor-pointer flex-col pt-2 px-2 pb-4">
				<div className="flex w-full justify-end gap-x-2">
					<DuplicateAgentButton
						agentId={agent.id}
						agentName={agent.name || "Untitled"}
					/>
					<DeleteAgentButton
						agentId={agent.id}
						agentName={agent.name || "Untitled"}
					/>
				</div>
				<Link
					href={`/workspaces/${agent.workspaceId}`}
					className="flex h-full flex-col pt-2"
					prefetch={false}
				>
					<AppThumbnail />
					<div className="mt-3 px-2">
						<h3 className="font-sans text-[16px] font-semibold text-inverse line-clamp-2">
							{agent.name || "Untitled"}
						</h3>
						<div className="flex items-center justify-between mt-1">
							<span className="max-w-[200px] truncate font-geist text-xs text-text/80">
								Edited <span suppressHydrationWarning>{relativeTime}</span>
							</span>
						</div>
					</div>
				</Link>
			</div>
		</section>
	);
}
