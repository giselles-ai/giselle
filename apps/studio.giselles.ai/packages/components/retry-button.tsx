import { Slot } from "@radix-ui/react-slot";
import { useExecution } from "../contexts/execution";
import type { ExecutionId, StepId } from "../types";

export function RetryButton({
	executionId,
	stepId,
	asChild = false,
	className = "",
	children,
}: {
	executionId: ExecutionId;
	stepId?: StepId;
	asChild?: boolean;
	className?: string;
	children: React.ReactNode;
}) {
	const { retryFlowExecution } = useExecution();
	const Comp = asChild ? Slot : "button";

	const handleRetry = () => {
		const message = stepId
			? "Are you sure you want to retry this step?"
			: "Are you sure you want to retry the entire flow?";

		if (confirm(message)) {
			retryFlowExecution(executionId, stepId);
		}
	};

	return (
		<Comp type="button" onClick={handleRetry} className={className}>
			{children}
		</Comp>
	);
}
