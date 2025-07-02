import type { Node } from "@giselle-sdk/data-type";
import { NodeComponent } from "../../node";
import type { Tool } from "../types";
import { useMousePosition } from "./state";

export const FloatingNodePreview = ({ node }: { node: Node }) => {
	const mousePosition = useMousePosition();

	return (
		<>
			<div
				className="fixed pointer-events-none inset-0"
				style={{
					transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
				}}
			>
				<div className="w-[180px]">
					<NodeComponent node={node} preview />
				</div>
			</div>
		</>
	);
};
