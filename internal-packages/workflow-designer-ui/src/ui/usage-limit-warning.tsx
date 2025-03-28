import { AlertCircleIcon } from "lucide-react";

export function UsageLimitWarning() {
	return (
		<div className="bg-yellow-100 border-l-4 border-yellow-500 p-2 mb-2 text-sm text-yellow-900 flex items-center">
			<AlertCircleIcon className="w-5 h-5 text-yellow-500 mr-2" />
			<span>
				You have reached the agent time limit. Please upgrade your plan.
			</span>
		</div>
	);
}
