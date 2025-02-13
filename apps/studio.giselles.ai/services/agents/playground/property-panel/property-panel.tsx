"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	type OnSelectionChangeFunc,
	useOnSelectionChange,
} from "@xyflow/react";
import { type FC, useCallback, useMemo, useState } from "react";
import { assertNodeClassName, nodeService } from "../../nodes";
import { usePlayground } from "../context";
// import { KnowledgeAccordion } from "./knowledge";
import { RequestPanel } from "./request-panel";

export const PropertyPanel: FC = () => {
	const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
	const [_, setSelectedEdges] = useState<string[]>([]);

	// the passed handler has to be memoized, otherwise the hook will not work correctly
	const onChange = useCallback<OnSelectionChangeFunc>(({ nodes, edges }) => {
		setSelectedNodes(nodes.map((node) => node.id));
		setSelectedEdges(edges.map((edge) => edge.id));
	}, []);

	useOnSelectionChange({
		onChange,
	});
	return (
		<div className="bg-black-100 border border-black-80 w-[400px] text-sm rounded-[8px] divide-y  divide-black-80">
			{/**<div className="p-[8px] flex justify-end">
				<button
					type="button"
					className="border border-black-30 rounded-[8px] px-[16px] py-[4px] text-black-30 flex gap-[2px] items-center"
				>
					<span>Run</span>
					<div className="w-[18px] h-[18px] flex justify-center items-center">
						<svg
							width="11"
							height="12"
							viewBox="0 0 11 12"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<title>Run</title>
							<path
								d="M9.81231 4.48402C10.0812 4.6303 10.3061 4.84866 10.4629 5.11571C10.6198 5.38276 10.7026 5.68844 10.7026 5.99998C10.7026 6.31153 10.6198 6.61721 10.4629 6.88426C10.3061 7.15131 10.0812 7.36967 9.81231 7.51595L2.63981 11.506C1.48489 12.1492 0.0662842 11.313 0.0662842 9.99063V2.00991C0.0662842 0.686951 1.48489 -0.148634 2.63981 0.493375L9.81231 4.48402Z"
								fill="#BAC6D0"
							/>
						</svg>
					</div>
				</button>
			</div>**/}
			<Tabs defaultValue="requests" className="divide-y h-full divide-black-80">
				<TabsList className="font-rosart">
					<TabsTrigger value="requests">Requests</TabsTrigger>
					<TabsTrigger value="properties">Properties</TabsTrigger>
				</TabsList>

				<TabsContent value="properties" className="flex flex-col gap-2">
					{selectedNodes.length === 0 ? null : selectedNodes.length > 1 ? (
						<p>{selectedNodes.length} nodes selected</p>
					) : (
						<NodeModifyPanelInner nodeId={selectedNodes[0]} />
					)}
				</TabsContent>
				<TabsContent
					value="requests"
					className="flex flex-col gap-2 h-full overflow-scroll"
				>
					<RequestPanel />
				</TabsContent>
			</Tabs>
		</div>
	);
};

type NodeModifyPanelInnerProps = {
	nodeId: string;
};
const NodeModifyPanelInner: FC<NodeModifyPanelInnerProps> = ({ nodeId }) => {
	const { state } = usePlayground();
	const Panel = useMemo(() => {
		const node = state.graph.nodes.find((node) => node.id === nodeId);
		if (node == null) {
			return null;
		}
		const className = node.className;
		assertNodeClassName(className);
		return nodeService.renderPanel(className, { node });
	}, [state, nodeId]);
	return <div className="flex flex-col gap-2 py-2">{Panel}</div>;
};
