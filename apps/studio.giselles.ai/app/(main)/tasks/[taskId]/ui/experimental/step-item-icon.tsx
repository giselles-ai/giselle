import { NodeIcon } from "@giselle-internal/workflow-designer-ui";
import type { OperationNode } from "@giselles-ai/protocol";
import {
	CircleDashedIcon,
	CircleSlashIcon,
	RefreshCwIcon,
	XIcon,
} from "lucide-react";
import type { UIStep } from "./task-data";

const iconClassName =
	"text-text-muted/70 group-hover:text-text-muted size-[14px] flex-shrink-0 transition-colors";

export function StepItemStatusIcon({
	status,
	operationNode,
}: {
	status: UIStep["status"];
	operationNode: OperationNode;
}) {
	switch (status) {
		case "created":
		case "queued":
			return <CircleDashedIcon className={iconClassName} />;
		case "running":
			return <RefreshCwIcon className={`${iconClassName} animate-spin`} />;
		case "completed":
			return <NodeIcon node={operationNode} className={iconClassName} />;
		case "failed":
			return (
				<XIcon className="text-red-400 size-[14px] flex-shrink-0 transition-colors" />
			);
		case "cancelled":
			return <CircleSlashIcon className={iconClassName} />;
		default: {
			const _exhaustiveCheck: never = status;
			console.warn(`Unknown status: ${_exhaustiveCheck}`);
			return null;
		}
	}
}
