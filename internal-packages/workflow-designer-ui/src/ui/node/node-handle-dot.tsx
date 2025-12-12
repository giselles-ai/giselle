import { Handle, Position } from "@xyflow/react";
import clsx from "clsx/lite";

type NodeHandleDotProps = {
	position: Position;
	isConnected: boolean;
	isConnectable?: boolean;
	contentType:
		| "textGeneration"
		| "contentGeneration"
		| "imageGeneration"
		| "github"
		| "vectorStoreGithub"
		| "vectorStoreGithubPullRequest"
		| "text"
		| "file"
		| "webPage"
		| "webSearch"
		| "audioGeneration"
		| "videoGeneration"
		| "trigger"
		| "action"
		| "query"
		| "end";
	id: string;
};

const borderToneByType: Record<NodeHandleDotProps["contentType"], string> = {
	textGeneration: "!border-generation-node-1",
	contentGeneration: "!border-generation-node-1",
	imageGeneration: "!border-image-generation-node-1",
	github: "!border-github-node-1",
	vectorStoreGithub: "!border-github-node-1",
	vectorStoreGithubPullRequest: "!border-github-node-1",
	text: "!border-text-node-1",
	file: "!border-file-node-1",
	webPage: "!border-webPage-node-1",
	webSearch: "!border-web-search-node-1",
	audioGeneration: "!border-audio-generation-node-1",
	videoGeneration: "!border-video-generation-node-1",
	trigger: "!border-trigger-node-1",
	action: "!border-action-node-1",
	query: "!border-query-node-1",
	end: "!border-trigger-node-1",
};

const fillToneByType: Record<NodeHandleDotProps["contentType"], string> = {
	textGeneration: "!bg-generation-node-1",
	contentGeneration: "!bg-generation-node-1",
	imageGeneration: "!bg-image-generation-node-1",
	github: "!bg-github-node-1",
	vectorStoreGithub: "!bg-github-node-1",
	vectorStoreGithubPullRequest: "!bg-github-node-1",
	text: "!bg-text-node-1",
	file: "!bg-file-node-1",
	webPage: "!bg-webPage-node-1",
	webSearch: "!bg-web-search-node-1",
	audioGeneration: "!bg-audio-generation-node-1",
	videoGeneration: "!bg-video-generation-node-1",
	trigger: "!bg-trigger-node-1",
	action: "!bg-action-node-1",
	query: "!bg-query-node-1",
	end: "!bg-trigger-node-1",
};

export function NodeHandleDot({
	position,
	isConnected,
	isConnectable = true,
	contentType,
	id,
}: NodeHandleDotProps) {
	let safeContentType: NodeHandleDotProps["contentType"] = "text";
	if (contentType in borderToneByType) {
		safeContentType = contentType;
	} else if (process.env.NODE_ENV !== "production") {
		// Warn in development when an unexpected type is passed
		// eslint-disable-next-line no-console
		console.warn(
			`Unknown contentType: ${String(contentType)}, falling back to "text"`,
		);
	}
	const isLeft = position === Position.Left;

	return (
		<Handle
			id={id}
			type={isLeft ? "target" : "source"}
			position={position}
			isConnectable={isConnectable}
			style={
				!isConnected
					? {
							background: "var(--color-background)",
							borderColor: "var(--color-border)",
						}
					: undefined
			}
			className={clsx(
				"!absolute !rounded-full !border-[1.5px]",
				isLeft
					? "!-left-[4.5px] !translate-x-[50%] !w-[11px] !h-[11px]"
					: "!right-[-0.5px] !w-[12px] !h-[12px]",
				borderToneByType[safeContentType],
				isConnected ? fillToneByType[safeContentType] : "",
			)}
		/>
	);
}
