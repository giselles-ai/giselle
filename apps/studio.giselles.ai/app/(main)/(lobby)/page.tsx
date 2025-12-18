import { notFound } from "next/navigation";
import { stageV2Flag } from "@/flags";

export default async function LobyPage() {
	const enableStageV2 = await stageV2Flag();
	if (!enableStageV2) {
		return notFound();
	}

	return (
		<div className="px-6 py-6 md:px-10 md:py-10 text-text">
			<section className="mb-8">
				<div className="h-32 md:h-40 w-full rounded-[12px] bg-surface/30 border border-border/10 grid place-items-center">
					<span className="text-text/60 text-sm">Tutorial video space</span>
				</div>
			</section>

			<section className="mb-6">
				<h2 className="text-[18px] font-semibold mb-3">
					where to start today?
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<button
						type="button"
						className="rounded-[8px] h-20 bg-surface/30 border border-border/10 text-left px-4"
					>
						Create new agent
					</button>
					<button
						type="button"
						className="rounded-[8px] h-20 bg-surface/30 border border-border/10 text-left px-4"
					>
						Try templates
					</button>
					<button
						type="button"
						className="rounded-[8px] h-20 bg-surface/30 border border-border/10 text-left px-4"
					>
						Ask / Review anything
					</button>
				</div>
			</section>

			<section className="mb-6">
				<h2 className="text-[18px] font-semibold mb-3">Use Apps</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="rounded-[8px] aspect-video bg-surface/30 border border-border/10 grid place-items-center text-text/60 text-sm">
						Template app
					</div>
					<div className="rounded-[8px] aspect-video bg-surface/30 border border-border/10 grid place-items-center text-text/60 text-sm">
						Template app
					</div>
					<div className="rounded-[8px] aspect-video bg-surface/30 border border-border/10 grid place-items-center text-text/60 text-sm">
						Template app
					</div>
				</div>
			</section>

			<section>
				<h2 className="text-[18px] font-semibold mb-3">Create workflow</h2>
				<div className="rounded-[8px] h-20 bg-surface/30 border border-border/10 grid place-items-center">
					<button type="button" className="text-link-muted hover:underline">
						+ create
					</button>
				</div>
			</section>
		</div>
	);
}
