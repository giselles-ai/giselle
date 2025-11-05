"use client";

import { IconBox } from "@giselle-internal/ui/icon-box";
import type { NodeLike } from "@giselles-ai/protocol";
import { Trash2 as TrashIcon } from "lucide-react";
import { PropertiesPanelHeader } from "./properties-panel";

export function NodePanelHeader({
	node,
	docsUrl,
	onChangeName,
	onDelete,
}: {
	node: NodeLike;
	docsUrl?: string;
	onChangeName?: (name?: string) => void;
	onDelete?: () => void;
}) {
	return (
		<PropertiesPanelHeader
			node={node}
			onChangeName={onChangeName}
			action={
				<div className="flex items-center gap-[6px] ml-[8px]">
					{docsUrl && (
						<IconBox
							aria-label="Open documentation"
							title="Open documentation"
							onClick={() =>
								window.open(docsUrl, "_blank", "noopener,noreferrer")
							}
						>
							<svg
								className="size-[14px]"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								role="img"
								aria-label="External link"
							>
								<path
									d="M14 3h7v7m0-7L10 14"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</IconBox>
					)}
					{onDelete && (
						<IconBox
							aria-label="Delete node"
							title="Delete node"
							onClick={() => onDelete()}
						>
							<TrashIcon className="size-[14px]" />
						</IconBox>
					)}
				</div>
			}
		/>
	);
}
