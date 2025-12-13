import clsx from "clsx/lite";
import Link from "next/link";
import { Accordion } from "radix-ui";
import { logger } from "@/lib/logger";
import { GenerationView } from "../../../../../../../../internal-packages/workflow-designer-ui/src/ui/generation-view";
import { StepItemStatusIcon } from "./step-item-icon";
import type { UIStepItem } from "./steps-section-data";

function StepItemHeader({
	item,
	as,
	containerClassName,
	textClassName,
	...props
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
			{...props}
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
					<StepItemOutput item={item} />
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	);
}

function StepItemOutput({ item }: { item: UIStepItem }) {
	const stepId = item.id;
	switch (item.status) {
		case "created":
		case "queued":
		case "running":
		case "cancelled":
			logger.warn(
				`Step ${item.id}: Unexpected step status "${item.status}" - this status should not reach here`,
			);
			return null;
		case "completed":
			return (
				<div className="ml-4 pl-4 border-l-2 border-border">
					<div className="py-4 [&_.markdown-renderer]:text-[13px] [&_*[class*='text-[14px]']]:text-[13px] [&_*]:text-text-muted/70 [&_*[class*='text-inverse']]:!text-text-muted/70">
						<GenerationView generation={item.generation} />
					</div>
				</div>
			);
		case "failed":
			return (
				<div className="ml-4 pl-4 border-l-2 border-border mt-2 mb-2">
					<div className="rounded-lg border border-border bg-surface/30 px-4 py-3">
						<p className="text-[13px] text-text-muted leading-relaxed">
							<span className="break-words">{item.error}</span>
							<br />
							To review or debug this step, open it in Studio.
						</p>
						<div className="flex items-center gap-2 mt-3">
							<Link
								href={`/workspaces/${item.workspaceId}`}
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
			const _exhaustiveCheck: never = item;
			logger.warn(`Step ${stepId}: Unhandled step status: ${_exhaustiveCheck}`);
			return null;
		}
	}
}
