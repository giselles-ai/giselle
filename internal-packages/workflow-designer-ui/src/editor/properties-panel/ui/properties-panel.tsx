"use client";

import type { NodeLike } from "@giselle-sdk/data-type";
import { defaultName } from "@giselle-sdk/giselle/react";
import type { ReactNode } from "react";
import { NodeIcon } from "../../../icons/node";
import { EditableText } from "../../../ui/editable-text";
import {
	getContentClasses,
	getHeaderClasses,
	PANEL_SPACING,
} from "./panel-spacing";

function getNodeIconColor(node: NodeLike): string {
	if (node.type === "operation") {
		switch (node.content.type) {
			case "textGeneration":
			case "imageGeneration":
			case "action":
				return "text-inverse";
			case "vectorStore":
			case "trigger":
			case "query":
				return "text-black-900";
			default:
				return "text-inverse";
		}
	}
	if (node.type === "variable") {
		switch (node.content.type) {
			case "github":
				return "text-black-900";
			case "text":
			case "file":
			case "webPage":
				return "text-black-900";
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
	console.log("getNodeIconBackground", {
		type: node.type,
		contentType: node.content.type,
	});
	if (node.type === "operation") {
		switch (node.content.type) {
			case "textGeneration":
				return "bg-generation-node-1";
			case "imageGeneration":
				return "bg-image-generation-node-1";
			case "trigger":
				return "bg-trigger-node-1";
			case "action":
				return "bg-action-node-1";
			case "query":
				return "bg-query-node-1";
			case "vectorStore":
				return "bg-github-node-1";
			default:
				return "bg-bg-900";
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
	description,
	icon,
	onChangeName,
	action,
}: {
	node: NodeLike;
	description?: string;
	icon?: ReactNode;
	onChangeName?: (name?: string) => void;
	action?: ReactNode;
}) {
	return (
		<div className={getHeaderClasses()}>
			<div className={`flex ${PANEL_SPACING.HEADER.ICON_GAP} items-center`}>
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
				<div>
					<div>
						<EditableText
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
						/>
					</div>
					{description && (
						<p className="px-[5px] text-white-400 text-[10px]">{description}</p>
					)}
				</div>
			</div>
			{action}
		</div>
	);
}

export function PropertiesPanelContent({ children }: { children: ReactNode }) {
	return <div className={getContentClasses()}>{children}</div>;
}
