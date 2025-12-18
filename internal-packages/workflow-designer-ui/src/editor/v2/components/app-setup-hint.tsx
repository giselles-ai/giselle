import { InfoIcon } from "lucide-react";
import { useAppDesignerStore } from "../../../app-designer";

export function AppSetupHint() {
	const { hasEndNode, hasStartNode, isStartNodeConnectedToEndNode } =
		useAppDesignerStore((s) => ({
			hasStartNode: s.hasStartNode(),
			hasEndNode: s.hasEndNode(),
			isStartNodeConnectedToEndNode: s.isStartNodeConnectedToEndNode(),
		}));

	if (isStartNodeConnectedToEndNode) {
		return null;
	}
	//
	if (!hasEndNode && !hasStartNode) {
		return null;
	}
	return (
		<div className="gap-[8px] px-[12px] py-[8px] bg-warning/20 backdrop-blur-sm border border-warning text-inverse rounded-[8px] shadow-lg hover:bg-warning/30 transition-colors">
			<div className="flex items-center gap-[8px]">
				<InfoIcon className="size-[16px]" />
				<p className="text-[14px] font-medium">
					Connect nodes to create a path from Start to End
				</p>
			</div>
		</div>
	);
}
