import type { VectorStoreNode } from "@giselle-sdk/data-type";
import {
	useVectorStore,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle-engine/react";
import { Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TriangleAlert } from "../../../../icons";
import { useGitHubVectorStoreStatus } from "../../../lib/use-github-vector-store-status";

type GitHubVectorStoreNodePropertiesPanelProps = {
	node: VectorStoreNode;
};

export function GitHubVectorStoreNodePropertiesPanel({
	node,
}: GitHubVectorStoreNodePropertiesPanelProps) {
	const { updateNodeDataContent } = useWorkflowDesigner();
	const vectorStore = useVectorStore();
	const github = vectorStore?.github;
	const settingPath = vectorStore?.settingPath;
	const vectorStoreInfos = github ?? [];

	const { isOrphaned, repositoryId } = useGitHubVectorStoreStatus(node);
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const selectedRepository = vectorStoreInfos.find(
		(info) => info.id === repositoryId,
	);

	const handleRepositoryChange = (selectedId: string) => {
		const selectedInfo = vectorStoreInfos.find(
			(info) => info.id === selectedId,
		);
		if (selectedInfo) {
			updateNodeDataContent(node, {
				...node.content,
				source: {
					...node.content.source,
					state: {
						status: "configured",
						owner: selectedInfo.reference.owner,
						repo: selectedInfo.reference.repo,
					},
				},
			});
		}
	};

	// Handle click outside to close dropdown
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	// Handle escape key to close dropdown
	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleEscape);
		}

		return () => {
			document.removeEventListener("keydown", handleEscape);
		};
	}, [isOpen]);

	return (
		<div className="flex flex-col gap-[17px] p-0">
			<div className="space-y-[4px]">
				<p className="text-[14px] py-[1.5px] text-white-400">
					GitHub Repository
				</p>
				{isOrphaned && node.content.source.state.status === "configured" && (
					<div className="flex items-center gap-[6px] text-error-900 text-[13px] mb-[8px]">
						<TriangleAlert className="size-[16px]" />
						<span>
							The repository{" "}
							<span className="font-mono font-semibold">
								{node.content.source.state.owner}/
								{node.content.source.state.repo}
							</span>{" "}
							is no longer available in your vector stores. Please select a
							different repository or set up this repository again.
						</span>
					</div>
				)}
				<div className="relative" ref={dropdownRef}>
					<button
						type="button"
						onClick={() => setIsOpen(!isOpen)}
						className="w-full px-3 py-2 bg-black-300/20 rounded-[8px] text-white-400 text-[14px] font-geist cursor-pointer text-left flex items-center justify-between"
					>
						<span className={selectedRepository?.name ? "" : "text-white/30"}>
							{selectedRepository?.name || "Select a repository"}
						</span>
						<ChevronDown className="h-4 w-4 text-white/60" />
					</button>
					{isOpen && (
						<div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-[8px] border-[0.25px] border-white/10 bg-black-850 p-1 shadow-none">
							{vectorStoreInfos.map((info) => (
								<button
									key={info.id}
									type="button"
									onClick={() => {
										handleRepositoryChange(info.id);
										setIsOpen(false);
									}}
									className="flex w-full items-center rounded-md px-3 py-2 text-left font-sans text-[14px] leading-[16px] text-white-400 hover:bg-white/5"
								>
									<span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
										{repositoryId === info.id && <Check className="h-4 w-4" />}
									</span>
									{info.name}
								</button>
							))}
						</div>
					)}
				</div>

				{settingPath && (
					<div className="pt-[8px] flex justify-end">
						<Link
							href={settingPath}
							className="text-white-400 hover:text-white-300 text-[14px] underline"
						>
							Set Up Vector Store
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}
