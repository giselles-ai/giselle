import { InfoIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useAppDesignerStore } from "../../../app-designer";

const dissolveMs = 200;

export function AppSetupHint() {
	const { hasEndNode, hasStartNode, isStartNodeConnectedToEndNode } =
		useAppDesignerStore((s) => ({
			hasStartNode: s.hasStartNode(),
			hasEndNode: s.hasEndNode(),
			isStartNodeConnectedToEndNode: s.isStartNodeConnectedToEndNode(),
		}));

	const shouldOfferSetupHint =
		(hasStartNode || hasEndNode) && !isStartNodeConnectedToEndNode;

	return (
		<AnimatePresence initial={false}>
			{shouldOfferSetupHint && (
				<motion.div
					className="px-[12px] py-[8px] bg-warning/20 backdrop-blur-sm border border-warning text-inverse rounded-[8px] shadow-lg hover:bg-warning/30 transition-colors"
					initial={{ opacity: 0, y: 3 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -3 }}
					transition={{ duration: dissolveMs / 1000, ease: "easeOut" }}
				>
					<div className="flex items-center gap-[8px]">
						<InfoIcon className="size-[16px]" />
						<p className="text-[14px] font-medium">
							Connect nodes to create a path from Start to End
						</p>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
