import type { Connection } from "@giselle-sdk/data-type";
import {
	BaseEdge,
	type EdgeProps,
	type Edge as XYFlowEdge,
	getBezierPath,
	useNodes,
} from "@xyflow/react";
import clsx from "clsx/lite";
import { CONNECTOR_COLORS } from "@giselle/foundation-ui/global-constants";

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
	const sourceNode = useNodes().find(node => node.id === data?.connection?.source);
	const targetNode = useNodes().find(node => node.id === data?.connection?.target);

	// Determine the color of the line based on the source and target nodes
	const defaultLineColor = CONNECTOR_COLORS.BLUE;
	let color = defaultLineColor;

	if (sourceNode && targetNode) {
		const outputType = sourceNode.contentType;
		const inputType = targetNode.contentType;

		// Special case for the Perplexity web search
		if (
			outputType === "textGeneration" &&
			inputType === "textGeneration" &&
			targetNode.data?.provider === "perplexity" &&
			(targetNode.data?.id === "sonar-pro" || targetNode.data?.id === "sonar")
		) {
			color = CONNECTOR_COLORS.GREEN;
		}
		// Check if the output node is image-generation type
		else if (outputType === "imageGeneration") {
			color = CONNECTOR_COLORS.IMAGE_GEN;
		}
		// Check if the input node is image-generation type
		else if (inputType === "imageGeneration") {
			color = CONNECTOR_COLORS.IMAGE_GEN;
		}
		// Check if the output node is web-search type
		else if (outputType === "webSearch") {
			color = CONNECTOR_COLORS.GREEN;
		}
		// Check if the input node is web-search type
		else if (inputType === "webSearch") {
			color = CONNECTOR_COLORS.GREEN;
		}
		// Check if the output node is audioGeneration type
		else if (outputType === "audioGeneration") {
			color = CONNECTOR_COLORS.YELLOW;
		}
		// Check if the input node is audioGeneration type
		else if (inputType === "audioGeneration") {
			color = CONNECTOR_COLORS.YELLOW;
		}
		// Check if the output node is videoGeneration type
		else if (outputType === "videoGeneration") {
			color = CONNECTOR_COLORS.VIDEO_GEN;
		}
		// Check if the input node is videoGeneration type
		else if (inputType === "videoGeneration") {
			color = CONNECTOR_COLORS.VIDEO_GEN;
		}
	}

	let gradientId = "";
	if (sourceNode && targetNode) {
		const outputType = sourceNode.contentType;
		const inputType = targetNode.contentType;

		// text generation to text generation
		if (outputType === "textGeneration" && inputType === "textGeneration") {
			gradientId = "textGenerationToTextGeneration";
		}
		// text generation to image generation
		else if (outputType === "textGeneration" && inputType === "imageGeneration") {
			gradientId = "textGenerationToImageGeneration";
		}
		// file to image generation
		else if (outputType === "file" && inputType === "imageGeneration") {
			gradientId = "fileToImageGeneration";
		}
		// text to image generation
		else if (outputType === "text" && inputType === "imageGeneration") {
			gradientId = "textToImageGeneration";
		}
		// text generation to web search
		else if (outputType === "textGeneration" && inputType === "webSearch") {
			gradientId = "textGenerationToWebSearch";
		}
		// file to web search
		else if (outputType === "file" && inputType === "webSearch") {
			gradientId = "fileToWebSearch";
		}
		// text to web search
		else if (outputType === "text" && inputType === "webSearch") {
			gradientId = "textToWebSearch";
		}
		// text generation to audio generation
		else if (
			outputType === "textGeneration" &&
			inputType === "audioGeneration"
		) {
			gradientId = "textGenerationToAudioGeneration";
		}
		// file to audio generation
		else if (outputType === "file" && inputType === "audioGeneration") {
			gradientId = "fileToAudioGeneration";
		}
		// text to audio generation
		else if (outputType === "text" && inputType === "audioGeneration") {
			gradientId = "textToAudioGeneration";
		}
		// text generation to video generation
		else if (
			outputType === "textGeneration" &&
			inputType === "videoGeneration"
		) {
			gradientId = "textGenerationToVideoGeneration";
		}
		// file to video generation
		else if (outputType === "file" && inputType === "videoGeneration") {
			gradientId = "fileToVideoGeneration";
		}
		// text to video generation
		else if (outputType === "text" && inputType === "videoGeneration") {
			gradientId = "textToVideoGeneration";
		}

		// If the target node is a perplexity node, it's a web search
		if (
			inputType === "textGeneration" &&
			targetNode.data?.provider === "perplexity" &&
			(targetNode.data?.id === "sonar-pro" || targetNode.data?.id === "sonar")
		) {
			// text generation to web search (perplexity)
			if (outputType === "textGeneration") {
				gradientId = "textGenerationToWebSearch";
			}
			// file to web search (perplexity)
			else if (outputType === "file") {
				gradientId = "fileToWebSearch";
			}
			// text to web search (perplexity)
			else if (outputType === "text") {
				gradientId = "textToWebSearch";
			}
		}
	}

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
	
	// Dynamic IDs
	const glowGradientId = `glow-gradient-${id}`;
	const animatedGradientId = `animated-gradient-${id}`;
	const whiteGlowFilterId = `white-glow-filter-${id}`;
	
	return (
		<g
			className="group"
			data-output-node-type={data.connection.outputNode.type}
			data-output-node-content-type={data.connection.outputNode.content.type}
			data-input-node-type={data.connection.inputNode.type}
			data-input-node-content-type={data.connection.inputNode.content.type}
		>
			{/* Define gradients and glow effects */}
			<defs>
				{/* Gradient for base glow */}
				<linearGradient id={glowGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor={color} stopOpacity="0.1" />
					<stop offset="100%" stopColor={color} stopOpacity="0.1" />
				</linearGradient>
				
				{/* Gradient for animation */}
				<linearGradient
					id={animatedGradientId}
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
					
					{/* Gradient animation */}
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
				
				{/* Filter for white light glow effect */}
				<filter
					id={whiteGlowFilterId}
					x="-50%"
					y="-50%"
					width="200%"
					height="200%"
				>
					<feGaussianBlur stdDeviation="3.5" result="blur" />
					<feComposite in="SourceGraphic" in2="blur" operator="over" />
				</filter>
			</defs>
			
			{/* Base connector line */}
			<BaseEdge
				id={id}
				path={edgePath}
				className={clsx(
					"!stroke-[1.5px] bg-white",
					"group-data-[output-node-content-type=textGeneration]:group-data-[input-node-content-type=textGeneration]:!stroke-[url(#textGenerationToTextGeneration)]",
					"group-data-[output-node-content-type=file]:group-data-[input-node-content-type=textGeneration]:!stroke-[url(#fileToTextGeneration)]",
					"group-data-[output-node-content-type=text]:group-data-[input-node-content-type=textGeneration]:!stroke-[url(#textToTextGeneration)]",
					"group-data-[output-node-content-type=textGeneration]:group-data-[input-node-content-type=imageGeneration]:!stroke-[url(#textGenerationToImageGeneration)]",
					"group-data-[output-node-content-type=file]:group-data-[input-node-content-type=imageGeneration]:!stroke-[url(#fileToImageGeneration)]",
					"group-data-[output-node-content-type=text]:group-data-[input-node-content-type=imageGeneration]:!stroke-[url(#textToImageGeneration)]",
					
					// Gradients for web search nodes
					"group-data-[output-node-content-type=textGeneration]:group-data-[input-node-content-type=webSearch]:!stroke-[url(#textGenerationToWebSearch)]",
					"group-data-[output-node-content-type=file]:group-data-[input-node-content-type=webSearch]:!stroke-[url(#fileToWebSearch)]",
					"group-data-[output-node-content-type=text]:group-data-[input-node-content-type=webSearch]:!stroke-[url(#textToWebSearch)]",
					
					// Gradients for audio generation nodes
					"group-data-[output-node-content-type=textGeneration]:group-data-[input-node-content-type=audioGeneration]:!stroke-[url(#textGenerationToAudioGeneration)]",
					"group-data-[output-node-content-type=file]:group-data-[input-node-content-type=audioGeneration]:!stroke-[url(#fileToAudioGeneration)]",
					"group-data-[output-node-content-type=text]:group-data-[input-node-content-type=audioGeneration]:!stroke-[url(#textToAudioGeneration)]",
					
					// Gradients for video generation nodes
					"group-data-[output-node-content-type=textGeneration]:group-data-[input-node-content-type=videoGeneration]:!stroke-[url(#textGenerationToVideoGeneration)]",
					"group-data-[output-node-content-type=file]:group-data-[input-node-content-type=videoGeneration]:!stroke-[url(#fileToVideoGeneration)]",
					"group-data-[output-node-content-type=text]:group-data-[input-node-content-type=videoGeneration]:!stroke-[url(#textToVideoGeneration)]",
				)}
			/>
			
			{/* Glowing base line */}
			<path
				d={edgePath}
				stroke={`url(#${glowGradientId})`}
				strokeWidth="3"
				fill="none"
				strokeLinecap="round"
				filter="drop-shadow(0 0 2.5px rgba(255,255,255,0.7))"
			/>
			
			{/* White gradient line (with glow effect) */}
			<path
				d={edgePath}
				stroke={`url(#${animatedGradientId})`}
				strokeWidth="2"
				fill="none"
				strokeLinecap="round"
				filter={`url(#${whiteGlowFilterId})`}
			/>
		</g>
	);
}

export function GradientDef() {
	return (
		<svg style={{ position: "absolute", width: 0, height: 0 }}>
			<defs>
				{/* Gradients for text generation nodes */}
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

				{/* Gradients for image generation nodes */}
				<linearGradient
					id="textGenerationToImageGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-primary-900)" />
					<stop offset="100%" stopColor="var(--color-image-generation-node-1)" />
				</linearGradient>
				<linearGradient
					id="fileToImageGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-node-data-900)" />
					<stop offset="100%" stopColor="var(--color-image-generation-node-1)" />
				</linearGradient>
				<linearGradient
					id="textToImageGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-node-plaintext-900)" />
					<stop offset="100%" stopColor="var(--color-image-generation-node-1)" />
				</linearGradient>

				{/* Gradients for web search nodes */}
				<linearGradient
					id="textGenerationToWebSearch"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-primary-900)" />
					<stop offset="100%" stopColor="var(--color-web-search-node-1)" />
				</linearGradient>
				<linearGradient
					id="fileToWebSearch"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-node-data-900)" />
					<stop offset="100%" stopColor="var(--color-web-search-node-1)" />
				</linearGradient>
				<linearGradient
					id="textToWebSearch"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-node-plaintext-900)" />
					<stop offset="100%" stopColor="var(--color-web-search-node-1)" />
				</linearGradient>

				{/* Gradients for audio generation nodes */}
				<linearGradient
					id="textGenerationToAudioGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-primary-900)" />
					<stop offset="100%" stopColor="var(--color-audio-generation-node-1)" />
				</linearGradient>
				<linearGradient
					id="fileToAudioGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-node-data-900)" />
					<stop offset="100%" stopColor="var(--color-audio-generation-node-1)" />
				</linearGradient>
				<linearGradient
					id="textToAudioGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-node-plaintext-900)" />
					<stop offset="100%" stopColor="var(--color-audio-generation-node-1)" />
				</linearGradient>

				{/* Gradients for video generation nodes */}
				<linearGradient
					id="textGenerationToVideoGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-primary-900)" />
					<stop offset="100%" stopColor="var(--color-video-generation-node-1)" />
				</linearGradient>
				<linearGradient
					id="fileToVideoGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-node-data-900)" />
					<stop offset="100%" stopColor="var(--color-video-generation-node-1)" />
				</linearGradient>
				<linearGradient
					id="textToVideoGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-node-plaintext-900)" />
					<stop offset="100%" stopColor="var(--color-video-generation-node-1)" />
				</linearGradient>
			</defs>
		</svg>
	);
}
