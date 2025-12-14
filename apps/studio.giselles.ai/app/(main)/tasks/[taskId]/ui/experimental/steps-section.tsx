import clsx from "clsx/lite";
import {
	ArrowRightIcon,
	CheckIcon,
	ChevronDownIcon,
	ListChecks,
} from "lucide-react";
import { Accordion } from "radix-ui";
import { StepItem } from "./step-item";
import type { UITask } from "./task-data";

function StepStatusMarker({
	status,
}: {
	status: UITask["stepsSection"]["steps"][number]["status"];
}) {
	// pending: outlined ring
	if (status === "created" || status === "queued") {
		return (
			<span
				aria-hidden="true"
				className="size-4 rounded-full border border-white/20"
			/>
		);
	}

	// running: filled circle + arrow icon
	if (status === "running") {
		return (
			<span
				aria-hidden="true"
				className="size-4 rounded-full bg-[hsl(192,73%,84%)]/70 text-black/70 flex items-center justify-center"
			>
				<ArrowRightIcon className="size-3" />
			</span>
		);
	}

	// completed: outlined ring + check icon
	if (status === "completed") {
		return (
			<span
				aria-hidden="true"
				className="size-4 rounded-full border border-[hsl(192,73%,84%)]/50 text-[hsl(192,73%,84%)]/80 flex items-center justify-center"
			>
				<CheckIcon className="size-3" />
			</span>
		);
	}

	// failed/cancelled: keep it visible but not noisy
	if (status === "failed") {
		return (
			<span
				aria-hidden="true"
				className="size-4 rounded-full border border-red-400/50 bg-red-400/10"
			/>
		);
	}
	if (status === "cancelled") {
		return (
			<span
				aria-hidden="true"
				className="size-4 rounded-full border border-white/15 bg-white/5"
			/>
		);
	}

	return (
		<span
			aria-hidden="true"
			className="size-4 rounded-full border border-white/15"
		/>
	);
}

export function StepsSection({
	title,
	totalStepsCount,
	completedStepsCount,
	steps,
}: UITask["stepsSection"]) {
	const progressRatio =
		totalStepsCount > 0 ? completedStepsCount / totalStepsCount : 0;
	return (
		<Accordion.Root
			type="single"
			className="w-full mt-4"
			collapsible
			defaultValue="step-list"
		>
			<Accordion.Item
				value="step-list"
				className="rounded-xl border border-border bg-surface/30"
			>
				<Accordion.Header>
					<Accordion.Trigger className="group flex items-start justify-between gap-3 text-text-muted w-full cursor-pointer hover:text-text-muted transition-colors px-3 py-2">
						<div className="min-w-0 flex items-start gap-2">
							<div className="relative w-4 h-4 flex items-center justify-center flex-shrink-0 mt-[1px]">
								<ListChecks className="absolute size-4 text-text-muted/70 transition-opacity duration-150 opacity-100 group-hover:opacity-0" />
								<ChevronDownIcon className="absolute size-4 -rotate-90 text-text-muted/70 transition-[opacity,transform] duration-150 opacity-0 group-hover:opacity-100 group-data-[state=open]:rotate-0" />
							</div>
							<div className="min-w-0">
								<div className="flex items-baseline gap-2">
									<p className="text-[13px] font-semibold">Steps</p>
									<span className="text-[13px] text-text-muted/70 tabular-nums">
										{totalStepsCount}
									</span>
								</div>
								<p className="text-[12px] text-text-muted/60 leading-snug">
									{title}
								</p>
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
						</div>
					</Accordion.Trigger>
				</Accordion.Header>
				<Accordion.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
					<div className="px-3 pb-3">
						<div className="mt-1.5 space-y-3">
							{steps.map((step) => (
								<Accordion.Root
									key={step.id}
									type="single"
									collapsible
									className="space-y-1.5"
								>
									<Accordion.Item value={step.id}>
										<Accordion.Header>
											<Accordion.Trigger className="group flex items-center gap-2 w-full text-left cursor-pointer">
												<div className="flex items-center gap-2 min-w-0">
													<div className="relative w-4 h-4 flex-shrink-0">
														<div className="absolute inset-0 flex items-center justify-center transition-opacity duration-150 opacity-100 group-hover:opacity-0">
															<StepStatusMarker status={step.status} />
														</div>
														<div className="absolute inset-0 flex items-center justify-center">
															<ChevronDownIcon className="size-4 -rotate-90 text-text-muted/70 transition-[opacity,transform] duration-150 opacity-0 group-hover:opacity-100 group-data-[state=open]:rotate-0" />
														</div>
													</div>
													<p
														className={clsx(
															"text-[12px] font-semibold leading-snug",
															step.status === "completed"
																? "text-[hsl(192,73%,84%)]/70"
																: step.status === "running"
																	? "text-text-muted"
																	: step.status === "failed"
																		? "text-red-400/90"
																		: "text-text-muted/70",
														)}
													>
														{step.title}
													</p>
												</div>
												{step.collapsedProgressText ? (
													<span className="ml-auto text-[11px] text-text-muted/60 tabular-nums transition-opacity duration-150 opacity-100 group-data-[state=open]:opacity-0 group-data-[state=open]:pointer-events-none">
														{step.collapsedProgressText}
													</span>
												) : null}
											</Accordion.Trigger>
										</Accordion.Header>
										<Accordion.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
											<div className="pl-3 space-y-1 mt-1.5">
												{step.items.map((item) => (
													<StepItem key={item.id} item={item} />
												))}
											</div>
										</Accordion.Content>
									</Accordion.Item>
								</Accordion.Root>
							))}
						</div>
					</div>
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	);
}
