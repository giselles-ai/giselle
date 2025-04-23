import type { Connection } from "@giselle-sdk/data-type";
import {
	BaseEdge,
	type EdgeProps,
	type Edge as XYFlowEdge,
	getBezierPath,
} from "@xyflow/react";
import clsx from "clsx/lite";

export type ConnectorType = XYFlowEdge<{ connection: Connection }>;

// Google-style color palette
const CONNECTOR_COLORS = {
	BLUE: '#4285F4',     // Google Blue
	GREEN: '#0F9D58',    // Google Green
	RED: '#DB4437',      // Google Red
	YELLOW: '#F4B400',   // Google Yellow
	PURPLE: '#9C27B0',   // Purple
	
	// New node type colors
	WEB_SEARCH: '#3A36FF',    // Web Search
	IMAGE_GEN: '#00A2FF',     // Image Generation
	AUDIO_GEN: '#0E3BC9',     // Audio Generation
	VIDEO_GEN: '#00BADF',     // Video Generation
};

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
	
	// Determine color based on node type
	let lineColor = CONNECTOR_COLORS.BLUE;  // Default color
	const outputType = data.connection.outputNode.content.type;
	const inputType = data.connection.inputNode.content.type;
	
	// Simple color determination based on node type
	if (outputType === 'imageGeneration' || inputType === 'imageGeneration') {
		lineColor = CONNECTOR_COLORS.IMAGE_GEN;
	}
	// Special case: Perplexity web search
	else if ((outputType === 'textGeneration' && 
		  data.connection.outputNode.content.type === 'textGeneration' &&
		  data.connection.outputNode.content.hasOwnProperty('llm') &&
		  data.connection.outputNode.content.llm?.provider === 'perplexity' &&
		  (data.connection.outputNode.content.llm?.id === 'sonar-pro' || data.connection.outputNode.content.llm?.id === 'sonar')) ||
		 (inputType === 'textGeneration' &&
		  data.connection.inputNode.content.type === 'textGeneration' &&
		  data.connection.inputNode.content.hasOwnProperty('llm') &&
		  data.connection.inputNode.content.llm?.provider === 'perplexity' &&
		  (data.connection.inputNode.content.llm?.id === 'sonar-pro' || data.connection.inputNode.content.llm?.id === 'sonar'))) {
		lineColor = CONNECTOR_COLORS.WEB_SEARCH;
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
					<stop offset="0%" stopColor={lineColor} stopOpacity="0.1" />
					<stop offset="100%" stopColor={lineColor} stopOpacity="0.1" />
				</linearGradient>
				
				{/* Gradient for animation */}
				<linearGradient id={animatedGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
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
				<filter id={whiteGlowFilterId} x="-50%" y="-50%" width="200%" height="200%">
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
		<svg role="graphics-symbol">
			<defs>
				<linearGradient
					id="textGenerationToTextGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-generation-node-1)" />
					<stop offset="100%" stopColor="var(--color-generation-node-1)" />
				</linearGradient>
				<linearGradient
					id="fileToTextGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-node-data-900)" />
					<stop offset="100%" stopColor="var(--color-generation-node-1)" />
				</linearGradient>
				<linearGradient
					id="textToTextGeneration"
					x1="0%"
					y1="0%"
					x2="100%"
					y2="0%"
				>
					<stop offset="0%" stopColor="var(--color-node-plaintext-900)" />
					<stop offset="100%" stopColor="var(--color-generation-node-1)" />
				</linearGradient>
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
