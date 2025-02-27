import type { Connection } from "@giselle-sdk/data-type";
import {
	BaseEdge,
	type EdgeProps,
	type Edge as XYFlowEdge,
	getBezierPath,
} from "@xyflow/react";
import clsx from "clsx/lite";

export type ConnectorType = XYFlowEdge<{ connection: Connection }>;

export function Connector({
	id,
	sourceX,
	sourceY,
	sourcePosition,
	targetX,
	targetY,
	targetPosition,
	data,
}: EdgeProps<ConnectorType>) {
	const [edgePath] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});
	if (data == null) {
		return null;
	}
	return (
		<g
			className="group"
			data-output-node-type={data.connection.outputNode.type}
			data-output-node-content-type={data.connection.outputNode.content.type}
			data-input-node-type={data.connection.inputNode.type}
			data-input-node-content-type={data.connection.inputNode.content.type}
		>
			<BaseEdge
				id={id}
				path={edgePath}
				className={clsx(
					"!stroke-[2px] bg-white drop-shadow-[0px_0px_16px_0px_hsla(187,_79%,_54%,_0.5)]",
					"group-data-[output-node-content-type=textGeneration]:group-data-[input-node-content-type=textGeneration]:!stroke-[url(#textGenerationToTextGeneration)]",
					"group-data-[output-node-content-type=file]:group-data-[input-node-content-type=textGeneration]:!stroke-[url(#fileToTextGeneration)]",
					"group-data-[output-node-content-type=text]:group-data-[input-node-content-type=textGeneration]:!stroke-[url(#textToTextGeneration)]",
				)}
			/>
		</g>
	);
}

export function GradientDef() {
	return (
		<svg role="graphics-symbol">
			<defs>
				<linearGradient
					id="textGenerationToTextGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-primary-900)" />
					<stop offset="100%" stopColor="var(--color-primary-900)" />
				</linearGradient>
				<linearGradient
					id="fileToTextGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-node-data-900)" />
					<stop offset="100%" stopColor="var(--color-primary-900)" />
				</linearGradient>
				<linearGradient
					id="textToTextGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-node-plaintext-900)" />
					<stop offset="100%" stopColor="var(--color-primary-900)" />
				</linearGradient>
			</defs>
		</svg>
	);
}
