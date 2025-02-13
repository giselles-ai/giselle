"use client";

import type { FC } from "react";
import { PortsField } from "../../components/ports-field";
import { PropertyField } from "../../components/property-field";
import { type NodeGraph, portDirection } from "../../types";

type TextNodePanelProps = {
	node: NodeGraph;
	textFieldName: string;
	textFieldValue: string;
};

export const TextNodePanel: FC<TextNodePanelProps> = ({
	node,
	textFieldName,
	textFieldValue,
}) => {
	return (
		<div className="divide-y">
			<div className="p-2">
				<PropertyField
					node={node}
					name={textFieldName}
					value={textFieldValue}
					label="Text"
				/>
			</div>
			<div className="p-2">
				<PortsField
					node={node}
					heading="Text Parameters"
					direction={portDirection.target}
				/>
			</div>
		</div>
	);
};
