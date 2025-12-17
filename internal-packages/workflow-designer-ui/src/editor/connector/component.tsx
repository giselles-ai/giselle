import type { NodeId } from "@giselles-ai/protocol";
import {
	useNodeGenerations,
	useWorkflowDesignerStore,
} from "@giselles-ai/react";
import { BaseEdge, type EdgeProps, getBezierPath } from "@xyflow/react";
import clsx from "clsx/lite";
import type { PropsWithChildren } from "react";
import { useShallow } from "zustand/shallow";

function ConnectedNodeRunning({
	inputNodeId,
	children,
}: PropsWithChildren<{
	inputNodeId: NodeId;
}>) {
	const workspaceId = useWorkflowDesignerStore(
		useShallow((s) => s.workspace.id),
	);
	const { currentGeneration: inputNodeCurrentGeneration } = useNodeGenerations({
		nodeId: inputNodeId,
		origin: { type: "studio", workspaceId },
	});
	if (
		inputNodeCurrentGeneration?.status === "queued" ||
		inputNodeCurrentGeneration?.status === "running"
	) {
		return children;
	}
	return null;
}

function getGradientColors(
	outputContentType: string,
	inputContentType: string,
): { startColor: string; endColor: string } {
	const colorMap: Record<string, string> = {
		textGeneration: "var(--color-primary-900)",
		contentGeneration: "var(--color-primary-900)",
		file: "var(--color-node-data-900)",
		webPage: "var(--color-webPage-node-1)",
		text: "var(--color-text-node-1)",
		imageGeneration: "var(--color-image-generation-node-1)",
		trigger: "var(--color-trigger-node-1)",
		action: "var(--color-action-node-1)",
		query: "var(--color-query-node-1)",
		vectorStore: "var(--color-vector-store-node-1)",
		appEntry: "var(--color-stage-node-1)",
		end: "var(--color-stage-node-1)",
	};

	return {
		startColor: colorMap[outputContentType] ?? "var(--color-primary-900)",
		endColor: colorMap[inputContentType] ?? "var(--color-primary-900)",
	};
}

export function Connector({
	id,
	sourceX,
	sourceY,
	sourcePosition,
	targetX,
	targetY,
	targetPosition,
}: EdgeProps) {
	const connection = useWorkflowDesignerStore(
		useShallow((s) =>
			s.workspace.connections.find((connection) => connection.id === id),
		),
	);
	if (connection === undefined) {
		return null;
	}
	const [edgePath] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});

	const outputContentType = connection.outputNode.content.type;
	const inputContentType = connection.inputNode.content.type;
	const gradientId = `gradient-${id}`;
	const { startColor, endColor } = getGradientColors(
		outputContentType,
		inputContentType,
	);

	// Calculate direction vector for animation
	const dx = targetX - sourceX;
	const dy = targetY - sourceY;
	const distance = Math.sqrt(dx * dx + dy * dy);
	const unitDx = distance > 0 ? dx / distance : 0;
	const unitDy = distance > 0 ? dy / distance : 0;

	// Animation distance (2x the path length for smooth animation)
	const animationDistance = distance * 2;

	return (
		<g
			className="group"
			data-output-node-type={connection.outputNode.type}
			data-output-node-content-type={outputContentType}
			data-input-node-type={connection.inputNode.type}
			data-input-node-content-type={inputContentType}
		>
			<defs>
				<linearGradient
					id={gradientId}
					gradientUnits="userSpaceOnUse"
					x1={sourceX}
					y1={sourceY}
					x2={targetX}
					y2={targetY}
				>
					<stop offset="0%" stopColor={startColor} />
					<stop offset="100%" stopColor={endColor} />
				</linearGradient>
				<linearGradient
					id={`${gradientId}-animation`}
					gradientUnits="userSpaceOnUse"
					x1={sourceX}
					y1={sourceY}
					x2={targetX}
					y2={targetY}
				>
					<stop offset="0%" stopColor="rgba(255,255,255,0)" />
					<stop offset="25%" stopColor="rgba(255,255,255,0)" />
					<stop offset="49%" stopColor="rgba(255,255,255,0.4)" />
					<stop offset="51%" stopColor="rgba(255,255,255,0.4)" />
					<stop offset="75%" stopColor="rgba(255,255,255,0)" />
					<stop offset="100%" stopColor="rgba(255,255,255,0)" />
					<animate
						attributeName="x1"
						from={sourceX - animationDistance * unitDx}
						to={targetX + animationDistance * unitDx}
						dur="1.8s"
						repeatCount="indefinite"
					/>
					<animate
						attributeName="x2"
						from={sourceX}
						to={targetX + 2 * animationDistance * unitDx}
						dur="1.8s"
						repeatCount="indefinite"
					/>
					<animate
						attributeName="y1"
						from={sourceY - animationDistance * unitDy}
						to={targetY + animationDistance * unitDy}
						dur="1.8s"
						repeatCount="indefinite"
					/>
					<animate
						attributeName="y2"
						from={sourceY}
						to={targetY + 2 * animationDistance * unitDy}
						dur="1.8s"
						repeatCount="indefinite"
					/>
				</linearGradient>
			</defs>
			<BaseEdge
				id={id}
				path={edgePath}
				className={clsx("!stroke-[1.5px] bg-bg")}
				style={{ stroke: `url(#${gradientId})` }}
				filter="url(#white-glow-filter)"
			/>
			<ConnectedNodeRunning inputNodeId={connection.inputNode.id}>
				<path
					d={edgePath}
					stroke={`url(#${gradientId}-animation)`}
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
