"use client";

import type { NodeLike } from "@giselles-ai/protocol";
import clsx from "clsx/lite";
import { Trash2 as TrashIcon } from "lucide-react";
import { IconBox } from "./icon-box";
import { PropertiesPanelHeader } from "./properties-panel";

export function NodePanelHeader({
	node,
	docsUrl,
	onChangeName,
	onDelete,
	readonly = false,
}: {
	node: NodeLike;
	docsUrl?: string;
	onChangeName?: (name?: string) => void;
	onDelete?: () => void;
	readonly?: boolean;
}) {
	return (
		<PropertiesPanelHeader
			node={node}
			onChangeName={onChangeName}
			action={
				<div className="flex items-center gap-[6px] ml-[8px]">
					{docsUrl && (
						<a
							aria-label="Open documentation"
							title="Open documentation"
							href={docsUrl}
							target="_blank"
							rel="noopener noreferrer"
							className={clsx(
								"relative inline-flex items-center justify-center",
								"rounded-[6px] size-[24px]",
								"text-text/80",
								"transition-colors duration-150",
								"bg-transparent hover:bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] focus-visible:bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)]",
								"outline-none focus-visible:outline-none",
							)}
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
						</a>
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
			readonly={readonly}
		/>
	);
}
