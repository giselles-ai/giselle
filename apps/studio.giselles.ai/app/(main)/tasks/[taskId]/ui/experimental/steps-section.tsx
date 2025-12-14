import clsx from "clsx/lite";
import { ChevronDownIcon, ListChecks } from "lucide-react";
import { Accordion } from "radix-ui";
import { StepItem } from "./step-item";
import type { UITask } from "./task-data";

export function StepsSection({
	title,
	totalStepsCount,
	completedStepsCount,
	steps,
}: UITask["stepsSection"]) {
	const progressRatio =
		totalStepsCount > 0 ? completedStepsCount / totalStepsCount : 0;
	return (
		<Accordion.Root type="single" className="w-full mt-6" collapsible>
			<Accordion.Item
				value="step-list"
				className="rounded-xl border border-border bg-surface/30"
			>
				<Accordion.Header>
					<Accordion.Trigger
						type="button"
						className="group flex items-start justify-between gap-3 text-text-muted w-full cursor-pointer hover:text-text-muted transition-colors px-4 py-3"
					>
						<div className="min-w-0 flex items-start gap-2">
							<ListChecks className="mt-[2px] size-4 flex-shrink-0 text-text-muted/70" />
							<div className="min-w-0">
								<div className="flex items-baseline gap-2">
									<p className="text-[13px] font-semibold">Steps</p>
									<span className="text-[13px] text-text-muted/70 tabular-nums">
										{totalStepsCount}
									</span>
								</div>
								<p className="text-[12px] text-text-muted/60">{title}</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							{totalStepsCount > 0 ? (
								<div className="flex items-center gap-1 text-[11px] text-text-muted/80">
									<div
										className="relative h-[6px] w-16 overflow-hidden rounded-full bg-white/5"
										aria-hidden="true"
									>
										<div
											className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,rgba(131,157,195,1),rgba(129,140,248,1))] transition-[width] duration-500 ease-out"
											style={{
												width: `${Math.min(Math.max(progressRatio, 0), 1) * 100}%`,
											}}
										/>
									</div>
									<span className="tabular-nums">
										{completedStepsCount}/{totalStepsCount}
									</span>
								</div>
							) : null}
							<div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
								<ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
							</div>
						</div>
					</Accordion.Trigger>
				</Accordion.Header>
				<Accordion.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
					<div className="px-4 pb-4">
						<div className="mt-2 space-y-5">
							{steps.map((step) => (
								<div key={step.id} className="space-y-2">
									<div className="flex items-center gap-2">
										<span
											aria-hidden="true"
											className={clsx(
												"size-2 rounded-full",
												step.status === "completed"
													? "bg-[hsl(192,73%,84%)]/60"
													: step.status === "running"
														? "bg-[hsl(192,73%,84%)]/60 animate-pulse"
														: step.status === "failed"
															? "bg-red-400/70"
															: "bg-white/15",
											)}
										/>
										<p
											className={clsx(
												"text-[13px] font-semibold",
												step.status === "completed"
													? "text-[hsl(192,73%,84%)]/70"
													: step.status === "running"
														? "bg-[length:200%_100%] bg-clip-text bg-gradient-to-r from-[hsl(192,73%,84%)] via-[hsl(192,73%,84%)_50%] to-[hsl(192,73%,84%)] text-transparent animate-shimmer"
														: step.status === "failed"
															? "text-red-400/90"
															: "text-text-muted/70",
											)}
										>
											{step.title}
										</p>
									</div>
									<div className="pl-4 space-y-1.5">
										{step.items.map((item) => (
											<StepItem key={item.id} item={item} />
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	);
}
