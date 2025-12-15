import clsx from "clsx/lite";
import { ChevronDownIcon } from "lucide-react";
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
			<Accordion.Item value="step-list">
				<Accordion.Header>
					<Accordion.Trigger
						type="button"
						className="group flex items-center gap-2 text-text-muted text-[13px] font-semibold py-2 w-full cursor-pointer hover:text-text-muted transition-colors"
					>
						<div className="flex items-center gap-2">
							<p className="block">{title}</p>
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
								<span>
									{completedStepsCount}/{totalStepsCount}
								</span>
							</div>
						</div>
						<div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
							<ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
						</div>
					</Accordion.Trigger>
				</Accordion.Header>
				<Accordion.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
					<div className="mt-4 mb-8 border-l border-border pl-3 space-y-4">
						{steps.map((step) => (
							<div
								key={step.id}
								className="grid grid-cols-[72px_540px] items-start gap-3"
							>
								<p
									className={clsx(
										"text-[13px] font-medium",
										step.status === "completed"
											? "text-[hsl(192,73%,84%)]/70"
											: step.status === "running"
												? "bg-[length:200%_100%] bg-clip-text bg-gradient-to-r from-[hsl(192,73%,84%)] via-[hsl(192,73%,84%)_50%] to-[hsl(192,73%,84%)] text-transparent animate-shimmer"
												: "text-text-muted/50",
									)}
								>
									{step.title}
								</p>
								<div className="space-y-2">
									{step.items.map((item) => (
										<StepItem key={item.id} item={item} />
									))}
								</div>
							</div>
						))}
					</div>
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	);
}
