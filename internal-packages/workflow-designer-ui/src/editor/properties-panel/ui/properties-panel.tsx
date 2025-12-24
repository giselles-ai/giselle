"use client";

import { defaultName } from "@giselles-ai/node-registry";
import type { NodeLike } from "@giselles-ai/protocol";
import clsx from "clsx/lite";
import type { ReactNode } from "react";
import { NodeIcon } from "../../../icons/node";
import { EditableText } from "../../../ui/editable-text";
import { STAGE_NODE_BG_CLASS_SOLID } from "../../node/node-utils";
import {
	getContentClasses,
	getHeaderClasses,
	PANEL_SPACING,
} from "./panel-spacing";

function getNodeIconColor(node: NodeLike): string {
	if (node.type === "operation") {
		// handle out-of-union runtime type safely without widening types
		if (`${node.content.type}` === "vectorStore") {
			return "text-background";
		}
		switch (node.content.type) {
			case "textGeneration":
			case "imageGeneration":
			case "action":
				return "text-inverse";
			case "trigger":
			case "query":
				return "text-background";
			default:
				return "text-inverse";
		}
	}
	if (node.type === "variable") {
		switch (node.content.type) {
			case "vectorStore":
				return "text-background";
			case "github":
				return "text-background";
			case "text":
			case "file":
			case "webPage":
				return "text-background";
			default:
				return "text-inverse";
		}
	}
	return "text-inverse";
}

export function PropertiesPanelRoot({ children }: { children: ReactNode }) {
	return (
		<div
			className={`${PANEL_SPACING.LAYOUT.FULL_HEIGHT} ${PANEL_SPACING.LAYOUT.FULL_WIDTH} ${PANEL_SPACING.LAYOUT.FLEX_COL} ${PANEL_SPACING.CONTENT.GAP} ${PANEL_SPACING.LAYOUT.OVERFLOW_HIDDEN}`}
		>
			{children}
		</div>
	);
}

function getNodeIconBackground(node: NodeLike): string {
	if (node.type === "operation") {
		if (`${node.content.type}` === "vectorStore") {
			return "bg-github-node-1";
		}
		switch (node.content.type) {
			case "textGeneration":
				return "bg-generation-node-1";
			case "contentGeneration":
				return "bg-generation-node-1";
			case "imageGeneration":
				return "bg-image-generation-node-1";
			case "appEntry":
				return STAGE_NODE_BG_CLASS_SOLID;
			case "trigger":
				return "bg-trigger-node-1";
			case "action":
				return "bg-action-node-1";
			case "query":
				return "bg-query-node-1";
			case "end":
				return STAGE_NODE_BG_CLASS_SOLID;
			default: {
				const _exhaustiveCheck: never = node.content.type;
				throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
			}
		}
	}
	if (node.type === "variable") {
		switch (node.content.type) {
			case "text":
				return "bg-text-node-1";
			case "file":
				return "bg-file-node-1";
			case "github":
				return "bg-github-node-1";
			case "vectorStore":
				return "bg-github-node-1";
			case "webPage":
				return "bg-webPage-node-1";
			default:
				return "bg-bg-900";
		}
	}
	return "bg-bg-900";
}

export function PropertiesPanelHeader({
	node,
	// description removed from UI
	icon,
	onChangeName,
	action,
	readonly = false,
}: {
	node: NodeLike;
	description?: string;
	icon?: ReactNode;
	onChangeName?: (name?: string) => void;
	action?: ReactNode;
	readonly?: boolean;
}) {
	return (
		<div className={getHeaderClasses()}>
			<div
				className={`flex flex-1 min-w-0 ${PANEL_SPACING.HEADER.ICON_GAP} items-center`}
			>
				<div
					className={`${getNodeIconBackground(node)} rounded-[4px] flex items-center justify-center`}
					style={{
						width: PANEL_SPACING.HEADER.ICON_SIZE,
						height: PANEL_SPACING.HEADER.ICON_SIZE,
					}}
				>
					{icon || (
						<NodeIcon
							node={node}
							className={`size-[16px] ${getNodeIconColor(node)}`}
						/>
					)}
				</div>
				<div className="flex-1 min-w-0">
					<EditableText
						className={clsx(
							"block w-full rounded-[8px]",
							!readonly &&
								"bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)]",
						)}
						inputClassName="px-[8px] py-[2px]"
						buttonClassName="px-[8px] py-[2px]"
						onValueChange={(value) => {
							if (value === defaultName(node)) {
								return;
							}
							if (value.trim().length === 0) {
								onChangeName?.();
								return;
							}
							onChangeName?.(value);
						}}
						text={defaultName(node)}
						readonly={readonly}
					/>
				</div>
			</div>
			{action}
		</div>
	);
}

export function PropertiesPanelContent({ children }: { children: ReactNode }) {
	return <div className={getContentClasses()}>{children}</div>;
}
