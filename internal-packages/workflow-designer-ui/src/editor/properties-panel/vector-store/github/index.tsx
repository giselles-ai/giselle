import type { VectorStoreNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "giselle-sdk/react";
import Link from "next/link"; // Next.jsのLinkコンポーネントをインポート
import { useMemo } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../../ui/select";
import { GitHubVectorStoreAdaptor } from "./github-vectore-store-adaptor";

type GitHubVectorStoreNodePropertiesPanelProps = {
	node: VectorStoreNode;
};

export function GitHubVectorStoreNodePropertiesPanel({
	node,
}: GitHubVectorStoreNodePropertiesPanelProps) {
	// TODO: get adaptor from context
	const adaptor = new GitHubVectorStoreAdaptor();
	const vectorStoreInfos = adaptor.getVectorStoreList();
	const { updateNodeDataContent } = useWorkflowDesigner();

	const currentSelectedRepoId = useMemo(() => {
		if (
			node.content.source?.provider === "github" &&
			node.content.source.state?.status === "configured"
		) {
			const currentState = node.content.source.state as {
				owner: string;
				repo: string;
			};
			const foundInfo = vectorStoreInfos.find(
				(info) =>
					info.reference.owner === currentState.owner &&
					info.reference.repo === currentState.repo,
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
					provider: "github",
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
				<div className="pt-[8px]">
					<Link
						href="/settings/team/vector-stores"
						className="text-blue-600 hover:text-blue-500 text-[14px] hover:underline"
					>
						Setup GitHub Vector Store →
					</Link>
				</div>
			</div>
		</div>
	);
}
