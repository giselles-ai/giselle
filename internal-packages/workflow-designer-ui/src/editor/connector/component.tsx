import type { Connection, NodeId } from "@giselle-sdk/data-type";
import {
	useNodeGenerations,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle/react";
import {
	BaseEdge,
	type EdgeProps,
	getBezierPath,
	type Edge as XYFlowEdge,
} from "@xyflow/react";
import clsx from "clsx/lite";
import type { PropsWithChildren } from "react";

export type ConnectorType = XYFlowEdge<{ connection: Connection }>;

function ConnectedNodeRunning({
	inputNodeId,
	children,
}: PropsWithChildren<{
	inputNodeId: NodeId;
}>) {
	const { data } = useWorkflowDesigner();
	const { currentGeneration: inputNodeCurrentGeneration } = useNodeGenerations({
		nodeId: inputNodeId,
		origin: { type: "studio", workspaceId: data.id },
	});
	if (
		inputNodeCurrentGeneration?.status === "queued" ||
		inputNodeCurrentGeneration?.status === "running"
	) {
		return children;
	}
	return null;
}

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
					"!stroke-[1.5px] bg-white",
					"group-data-[output-node-content-type=textGeneration]:group-data-[input-node-content-type=textGeneration]:!stroke-[url(#textGenerationToTextGeneration)]",
					"group-data-[output-node-content-type=file]:group-data-[input-node-content-type=textGeneration]:!stroke-[url(#fileToTextGeneration)]",
					"group-data-[output-node-content-type=webPage]:group-data-[input-node-content-type=textGeneration]:!stroke-[url(#webPageToTextGeneration)]",
					"group-data-[output-node-content-type=webPage]:group-data-[input-node-content-type=textGeneration]:!stroke-[url(#webPageToTextGeneration)]",
					"group-data-[output-node-content-type=text]:group-data-[input-node-content-type=textGeneration]:!stroke-[url(#textToTextGeneration)]",
					"group-data-[output-node-content-type=query]:group-data-[input-node-content-type=textGeneration]:!stroke-[url(#queryToTextGeneration)]",
					"group-data-[output-node-content-type=action]:group-data-[input-node-content-type=textGeneration]:!stroke-[url(#actionToTextGeneration)]",
					"group-data-[output-node-content-type=textGeneration]:group-data-[input-node-content-type=imageGeneration]:!stroke-[url(#textGenerationToImageGeneration)]",
					"group-data-[output-node-content-type=file]:group-data-[input-node-content-type=imageGeneration]:!stroke-[url(#fileToImageGeneration)]",
					"group-data-[output-node-content-type=webPage]:group-data-[input-node-content-type=imageGeneration]:!stroke-[url(#webPageToImageGeneration)]",
					"group-data-[output-node-content-type=text]:group-data-[input-node-content-type=imageGeneration]:!stroke-[url(#textToImageGeneration)]",
					"group-data-[output-node-content-type=trigger]:group-data-[input-node-content-type=textGeneration]:!stroke-[url(#triggerToTextGeneration)]",
					"group-data-[output-node-content-type=trigger]:group-data-[input-node-content-type=imageGeneration]:!stroke-[url(#triggerToImageGeneration)]",
					"group-data-[output-node-content-type=trigger]:group-data-[input-node-content-type=action]:!stroke-[url(#triggerToAction)]",
					"group-data-[output-node-content-type=textGeneration]:group-data-[input-node-content-type=action]:!stroke-[url(#textGenerationToAction)]",
					"group-data-[output-node-content-type=file]:group-data-[input-node-content-type=action]:!stroke-[url(#fileToAction)]",
					"group-data-[output-node-content-type=webPage]:group-data-[input-node-content-type=action]:!stroke-[url(#webPageToAction)]",
					"group-data-[output-node-content-type=text]:group-data-[input-node-content-type=action]:!stroke-[url(#textToAction)]",
					"group-data-[output-node-content-type=textGeneration]:group-data-[input-node-content-type=query]:!stroke-[url(#textGenerationToQueryNode)]",
					"group-data-[output-node-content-type=file]:group-data-[input-node-content-type=query]:!stroke-[url(#fileToQueryNode)]",
					"group-data-[output-node-content-type=webPage]:group-data-[input-node-content-type=query]:!stroke-[url(#webPageToQueryNode)]",
					"group-data-[output-node-content-type=text]:group-data-[input-node-content-type=query]:!stroke-[url(#textToQueryNode)]",
					"group-data-[output-node-content-type=vectorStore]:group-data-[input-node-content-type=query]:!stroke-[url(#vectorStoreToQueryNode)]",
					"group-data-[output-node-content-type=trigger]:group-data-[input-node-content-type=query]:!stroke-[url(#triggerToQueryNode)]",
					"group-data-[output-node-content-type=action]:group-data-[input-node-content-type=query]:!stroke-[url(#actionToQueryNode)]",
					"group-data-[output-node-content-type=trigger]:group-data-[input-node-content-type=query]:!stroke-[url(#triggerToQueryNode)]",
					"group-data-[output-node-content-type=action]:group-data-[input-node-content-type=query]:!stroke-[url(#actionToQueryNode)]",
					"group-data-[output-node-content-type=query]:group-data-[input-node-content-type=textGeneration]:!stroke-[url(#queryToTextGeneration)]",
				)}
				filter="url(#white-glow-filter)"
			/>
			<ConnectedNodeRunning inputNodeId={data.connection.inputNode.id}>
				<path
					d={edgePath}
					stroke="url(#connector-gradient-animation)"
					strokeWidth="2"
					fill="none"
					strokeLinecap="round"
					filter="url(#white-glow-filter)"
				/>
			</ConnectedNodeRunning>
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
					id="webPageToTextGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-webPage-node-1)" />
					<stop offset="100%" stopColor="var(--color-primary-900)" />
				</linearGradient>
				<linearGradient
					id="webPageToTextGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-webPage-node-1)" />
					<stop offset="100%" stopColor="var(--color-webPage-node-1)" />
				</linearGradient>
				<linearGradient
					id="textToTextGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-text-node-1)" />
					<stop offset="100%" stopColor="var(--color-primary-900)" />
				</linearGradient>
				<linearGradient
					id="textGenerationToImageGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-primary-900)" />
					<stop offset="100%" stopColor="var(--color-primary-900)" />
				</linearGradient>
				<linearGradient
					id="webPageToImageGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-webPage-node-1)" />
					<stop offset="100%" stopColor="var(--color-primary-900)" />
				</linearGradient>
				<linearGradient
					id="fileToImageGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-node-data-900)" />
					<stop offset="100%" stopColor="var(--color-primary-900)" />
				</linearGradient>
				<linearGradient
					id="webPageToImageGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-webPage-node-1)" />
					<stop offset="100%" stopColor="var(--color-webPage-node-1)" />
				</linearGradient>
				<linearGradient
					id="textToImageGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-text-node-1)" />
					<stop offset="100%" stopColor="var(--color-primary-900)" />
				</linearGradient>
				<linearGradient
					id="triggerToTextGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-trigger-node-1)" />
					<stop offset="100%" stopColor="var(--color-primary-900)" />
				</linearGradient>
				<linearGradient
					id="triggerToImageGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-trigger-node-1)" />
					<stop offset="100%" stopColor="var(--color-primary-900)" />
				</linearGradient>
				<linearGradient id="triggerToAction" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="var(--color-trigger-node-1)" />
					<stop offset="100%" stopColor="var(--color-action-node-1)" />
				</linearGradient>
				<linearGradient id="webPageToAction" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="var(--color-webPage-node-1)" />
					<stop offset="100%" stopColor="var(--color-action-node-1)" />
				</linearGradient>
				<linearGradient
					id="textGenerationToAction"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-primary-900)" />
					<stop offset="100%" stopColor="var(--color-action-node-1)" />
				</linearGradient>
				<linearGradient id="fileToAction" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="var(--color-node-data-900)" />
					<stop offset="100%" stopColor="var(--color-action-node-1)" />
				</linearGradient>
				<linearGradient id="webPageToAction" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="var(--color-webPage-node-1)" />
					<stop offset="100%" stopColor="var(--color-webPage-node-1)" />
				</linearGradient>
				<linearGradient id="textToAction" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="var(--color-text-node-1)" />
					<stop offset="100%" stopColor="var(--color-action-node-1)" />
				</linearGradient>

				<linearGradient
					id="textGenerationToQueryNode"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-primary-900)" />
					<stop offset="100%" stopColor="var(--color-query-node-1)" />
				</linearGradient>
				<linearGradient
					id="webPageToQueryNode"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-webPage-node-1)" />
					<stop offset="100%" stopColor="var(--color-query-node-1)" />
				</linearGradient>
				<linearGradient id="fileToQueryNode" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="var(--color-node-data-900)" />
					<stop offset="100%" stopColor="var(--color-query-node-1)" />
				</linearGradient>
				<linearGradient
					id="webPageToQueryNode"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-webPage-node-1)" />
					<stop offset="100%" stopColor="var(--color-webPage-node-1)" />
				</linearGradient>
				<linearGradient id="textToQueryNode" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="var(--color-text-node-1)" />
					<stop offset="100%" stopColor="var(--color-query-node-1)" />
				</linearGradient>
				<linearGradient
					id="vectorStoreToQueryNode"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-vector-store-node-1)" />
					<stop offset="100%" stopColor="var(--color-query-node-1)" />
				</linearGradient>
				<linearGradient
					id="triggerToQueryNode"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-trigger-node-1)" />
					<stop offset="100%" stopColor="var(--color-query-node-1)" />
				</linearGradient>

				<linearGradient
					id="actionToQueryNode"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-action-node-1)" />
					<stop offset="100%" stopColor="var(--color-query-node-1)" />
				</linearGradient>

				<linearGradient
					id="queryToTextGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-query-node-1)" />
					<stop offset="100%" stopColor="var(--color-primary-900)" />
				</linearGradient>

				<linearGradient
					id="actionToTextGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-action-node-1)" />
					<stop offset="100%" stopColor="var(--color-primary-900)" />
				</linearGradient>

				<linearGradient
					id="connector-gradient-animation"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="rgba(255,255,255,0)" />
					<stop offset="25%" stopColor="rgba(255,255,255,0)" />
					<stop offset="49%" stopColor="rgba(255,255,255,0.4)" />
					<stop offset="51%" stopColor="rgba(255,255,255,0.4)" />
					<stop offset="75%" stopColor="rgba(255,255,255,0)" />
					<stop offset="100%" stopColor="rgba(255,255,255,0)" />

					<animate
						attributeName="x1"
						from="-100%"
						to="100%"
						dur="1.8s"
						repeatCount="indefinite"
					/>
					<animate
						attributeName="x2"
						from="0%"
						to="200%"
						dur="1.8s"
						repeatCount="indefinite"
					/>
				</linearGradient>
				<filter
					id="white-glow-filter"
					x="-50%"
					y="-50%"
					width="200%"
					height="200%"
				>
					<feGaussianBlur stdDeviation="3.5" result="blur" />
					<feComposite in="SourceGraphic" in2="blur" operator="over" />
				</filter>
			</defs>
		</svg>
	);
}
