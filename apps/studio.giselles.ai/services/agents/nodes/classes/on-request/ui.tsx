"use client";

import type { FC } from "react";
import { PortsField } from "../../components/ports-field";
import { type NodeGraph, portDirection } from "../../types";

type OnRequestNodePanelProps = {
	node: NodeGraph;
};
export const OnRequestNodePanel: FC<OnRequestNodePanelProps> = ({ node }) => {
	return (
		<div className="divide-y">
			<div className="p-2">
				<PortsField
					node={node}
					heading="Parameters"
					direction={portDirection.source}
				/>
			</div>
		</div>
	);
};
