import { createEndNode } from "@giselles-ai/node-registry";
import { isAppEntryNode, type Node } from "@giselles-ai/protocol";
import { useMemo } from "react";
import { NodeComponent, PillNode } from "../../node";
import { useMousePosition } from "./state";

function PreviewConnector() {
	return (
		<svg
			aria-hidden="true"
			className="text-inverse/40"
			width="28"
			height="12"
			viewBox="0 0 28 12"
			fill="none"
		>
			<path d="M0 6H24" stroke="currentColor" strokeWidth="1.5" />
			<path
				d="M20 2L24 6L20 10"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export const FloatingNodePreview = ({ node }: { node: Node }) => {
	const mousePosition = useMousePosition();
	const isAppEntry = isAppEntryNode(node);
	const endNode = useMemo(
		() => (isAppEntry ? createEndNode() : null),
		[isAppEntry],
	);

	return (
		<div
			className="fixed pointer-events-none inset-0"
			style={{
				transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
			}}
		>
			<div className={isAppEntry ? "w-max" : "w-[180px]"}>
				{isAppEntry ? (
					<div className="flex items-center gap-[12px]">
						<PillNode node={node} preview />
						<PreviewConnector />
						{endNode && <PillNode node={endNode} preview />}
					</div>
				) : (
					<NodeComponent node={node} preview />
				)}
			</div>
		</div>
	);
};
