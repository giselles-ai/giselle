import { agents, db } from "@/drizzle";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchCurrentTeam } from "@/services/teams";
import { createId } from "@paralleldrive/cuid2";
import { ExternalLink, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { giselleEngine } from "../../giselle-engine";

export default function Layout({
	children,
}: {
	children: ReactNode;
}) {
	async function createAgent() {
		"use server";
		const agentId = `agnt_${createId()}` as const;
		const user = await fetchCurrentUser();
		const team = await fetchCurrentTeam();
		const workspace = await giselleEngine.createWorkspace();

		await db.insert(agents).values({
			id: agentId,
			teamDbId: team.dbId,
			creatorDbId: user.dbId,
			workspaceId: workspace.id,
		});
		redirect(`/workspaces/${workspace.id}`);
	}

	return (
		<div className="h-full bg-black-900">
			<div className="px-[40px] py-[24px] flex-1 max-w-[1200px] mx-auto w-full">
				<div className="flex justify-between items-center mb-8">
					<h1
						className="text-[30px] font-sans font-medium text-[hsl(192,73%,84%)]"
						style={{
							textShadow:
								"0 0 20px #0087f6, 0 0 40px #0087f6, 0 0 60px #0087f6",
						}}
					>
						Apps
					</h1>
					<div className="flex items-center gap-4">
						<a
							href="https://docs.giselles.ai/guides/apps/teamapp"
							target="_blank"
							rel="noopener noreferrer"
							className="text-black-300 text-[14px] font-medium rounded-[4px] px-1.5 py-0.5 hover:bg-black-300/10 flex items-center gap-1.5 font-sans"
						>
							About Apps
							<ExternalLink size={14} />
						</a>
						<form action={createAgent}>
							<button
								type="submit"
								className="group relative overflow-hidden rounded-lg px-4 py-2 text-white transition-all duration-300 hover:scale-[1.01] active:scale-95"
								style={{
									boxShadow:
										"0 8px 20px rgba(107, 143, 240, 0.2), 0 3px 10px rgba(107, 143, 240, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -1px 0 rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.08)",
								}}
							>
								{/* Outer glow */}
								<div
									className="absolute inset-0 rounded-lg blur-[2px] -z-10"
									style={{ backgroundColor: "#6B8FF0", opacity: 0.08 }}
								/>

								{/* Main glass background */}
								<div
									className="absolute inset-0 rounded-lg backdrop-blur-md"
									style={{
										background:
											"linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(107,143,240,0.1) 50%, rgba(107,143,240,0.2) 100%)",
									}}
								/>

								{/* Top reflection */}
								<div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

								{/* Subtle border */}
								<div className="absolute inset-0 rounded-lg border border-white/20" />

								{/* Content */}
								<span className="relative z-10 flex items-center gap-2">
									<span className="grid place-items-center rounded-full size-4 bg-primary-200 opacity-50">
										<Plus className="size-3 text-black-900" />
									</span>
									<span className="text-[14px] leading-[20px] font-medium">
										New App
									</span>
								</span>

								{/* Hover overlay */}
								<div className="absolute inset-0 rounded-lg bg-gradient-to-t from-transparent to-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
							</button>
						</form>
					</div>
				</div>
				{children}
			</div>
		</div>
	);
}
