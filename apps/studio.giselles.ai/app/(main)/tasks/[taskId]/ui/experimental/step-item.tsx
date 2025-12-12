import type {
	GenerationStatus,
	OperationNode,
	StepId,
} from "@giselles-ai/protocol";
import clsx from "clsx/lite";
import Link from "next/link";
import { Accordion } from "radix-ui";
import { logger } from "@/lib/logger";
import { StepItemStatusIcon } from "./step-item-icon";

export interface UIStepItem {
	/**
	 * In the protocol, the structure is Sequence > Step,
	 * but in the UI it's Step > StepItem,
	 * so this is awkward but works
	 */
	id: StepId;
	title: string;
	subLabel?: string;
	node: OperationNode;
	status: GenerationStatus;
	finished: boolean;
}

function StepItemHeader({
	item,
	as,
	containerClassName,
	textClassName,
}: {
	item: UIStepItem;
	as?: "div" | "button";
	containerClassName?: string;
	textClassName?: string;
}) {
	const labelClassName = clsx(
		"text-[13px] text-text-muted/70 transition-colors",
		textClassName,
	);

	const Component = as ?? "div";

	return (
		<Component
			{...(Component === "button" ? { type: "button" as const } : null)}
			className={clsx(
				"flex-1 flex items-center gap-3 text-left",
				containerClassName,
			)}
		>
			<StepItemStatusIcon status={item.status} operationNode={item.node} />
			<span className={labelClassName}>{item.title}</span>
			{item.subLabel ? (
				<span className={labelClassName}>{item.subLabel}</span>
			) : null}
		</Component>
	);
}

export function StepItem({ item }: { item: UIStepItem }) {
	if (!item.finished) {
		return <StepItemHeader item={item} />;
	}

	return (
		<Accordion.Root type="single" collapsible>
			<Accordion.Item value={item.id}>
				<Accordion.Header>
					<Accordion.Trigger asChild>
						<StepItemHeader
							as="button"
							item={item}
							containerClassName="group cursor-pointer"
							textClassName="group-hover:text-text-muted"
						/>
					</Accordion.Trigger>
				</Accordion.Header>

				<Accordion.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
					<StepOutput step={item} />
					<div className="ml-4 pl-4 border-l-2 border-border">
						<div className="py-4 [&_.markdown-renderer]:text-[13px] [&_*[class*='text-[14px]']]:text-[13px] [&_*]:text-text-muted/70 [&_*[class*='text-inverse']]:!text-text-muted/70">
							{/*<GenerationView generation={generation} />*/}
							todo: generation
						</div>
					</div>
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	);
}

export function StepOutput({ step }: { step: UIStepItem }) {
	switch (step.status) {
		case "created":
		case "queued":
		case "running":
		case "cancelled":
			logger.warn(
				`Step ${step.id}: Unexpected step status "${step.status}" - this status should not reach here`,
			);
			return null;
		case "completed":
			return (
				<div className="ml-4 pl-4 border-l-2 border-border">
					<div className="py-4 [&_.markdown-renderer]:text-[13px] [&_*[class*='text-[14px]']]:text-[13px] [&_*]:text-text-muted/70 [&_*[class*='text-inverse']]:!text-text-muted/70">
						{/*<GenerationView generation={generation} />*/}
						todo: generation
					</div>
				</div>
			);
		case "failed":
			return (
				<div className="ml-4 pl-4 border-l-2 border-border mt-2 mb-2">
					<div className="rounded-lg border border-border bg-surface/30 px-4 py-3">
						<p className="text-[13px] text-text-muted leading-relaxed">
							This step failed during the last run.
							<br />
							Individual step execution is not available on this page.
							<br />
							To review or debug this step, open it in Studio.
						</p>
						<div className="flex items-center gap-2 mt-3">
							<Link
								href={`/workspaces/${workspaceId}`}
								target="_blank"
								rel="noreferrer"
								className="text-[13px] text-[hsl(192,73%,84%)] hover:text-[hsl(192,73%,70%)] transition-colors font-medium"
							>
								Open Step in Studio →
							</Link>
							{/*{onRerun && (
								<button
									type="button"
									onClick={onRerun}
									className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 border border-border text-[13px] text-text-muted hover:bg-white/10 hover:text-text transition-colors"
								>
									<RefreshCw className="size-3.5" />
									Run full flow again
								</button>
							)}*/}
						</div>
					</div>
				</div>
			);
		default: {
			const _exhaustiveCheck: never = step.status;
			logger.warn(
				`Step ${step.id}: Unhandled step status: ${_exhaustiveCheck}`,
			);
			return null;
		}
	}
}
