import type { VectorStoreNode } from "@giselle-sdk/data-type";
import { useVectorStore, useWorkflowDesigner } from "giselle-sdk/react";
import Link from "next/link";
import { useMemo } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../../ui/select";

type GitHubVectorStoreNodePropertiesPanelProps = {
	node: VectorStoreNode;
};

export function GitHubVectorStoreNodePropertiesPanel({
	node,
}: GitHubVectorStoreNodePropertiesPanelProps) {
	const { updateNodeDataContent } = useWorkflowDesigner();
	const { github, settingPath } = useVectorStore();
	const vectorStoreInfos = github ?? [];

	const currentSelectedRepoId = useMemo(() => {
		const sourceState = node.content.source.state;
		if (sourceState.status === "configured") {
			const foundInfo = vectorStoreInfos.find(
				(info) =>
					info.reference.owner === sourceState.owner &&
					info.reference.repo === sourceState.repo,
			);
			return foundInfo?.id;
		}
		return undefined;
	}, [node.content.source, vectorStoreInfos]);

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

	return (
		<div className="flex flex-col gap-[17px] p-0">
			<div className="space-y-[4px]">
				<p className="text-[14px] py-[1.5px] text-white-400">
					GitHub Repository
				</p>
				<Select
					value={currentSelectedRepoId}
					onValueChange={handleRepositoryChange}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select a repository" />
					</SelectTrigger>
					<SelectContent>
						{vectorStoreInfos.map((info) => (
							<SelectItem key={info.id} value={info.id}>
								{info.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{settingPath && (
					<div className="pt-[8px]">
						<Link
							href={settingPath}
							className="text-blue-600 hover:text-blue-500 text-[14px] hover:underline"
						>
							Set Up GitHub Vector Store →
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}
