import {
	type Node,
	NodeId,
	WorkspaceGitHubIntegrationPayloadField,
	type WorkspaceGitHubIntegrationPayloadNodeMap,
} from "@giselle-sdk/data-type";
import { Pi, PlusIcon, TrashIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui";

const getDisplayName = (node: Node) => {
	if ("content" in node && "llm" in node.content) {
		return node.name ?? node.content.llm.id;
	}
	return node.name ?? "Source";
};

export function PayloadMapForm({
	nodes,
	currentPayloadMaps = [],
}: {
	nodes: Node[];
	currentPayloadMaps?: WorkspaceGitHubIntegrationPayloadNodeMap[];
}) {
	const [selectedNodeId, setSelectedNodeId] = useState<NodeId | string>("");
	const [selectedPayload, setSelectedPayload] = useState<
		WorkspaceGitHubIntegrationPayloadField | string
	>("");
	const [payloadMaps, setPayloadMaps] =
		useState<WorkspaceGitHubIntegrationPayloadNodeMap[]>(currentPayloadMaps);

	const [showNewPayloadFieldsFlag, setShowNewPayloadFieldsFlag] =
		useState(false);
	useEffect(() => {
		const parseSelectedNodeId = NodeId.safeParse(selectedNodeId);
		const parseSelectedPayload =
			WorkspaceGitHubIntegrationPayloadField.safeParse(selectedPayload);
		if (!parseSelectedNodeId.success || !parseSelectedPayload.success) {
			return;
		}
		setPayloadMaps((prev) => [
			...prev,
			{ nodeId: parseSelectedNodeId.data, payload: parseSelectedPayload.data },
		]);
		setSelectedNodeId("");
		setSelectedPayload("");
		setShowNewPayloadFieldsFlag(false);
	}, [selectedNodeId, selectedPayload]);
	const removePayloadMap = useCallback(
		(removePayloadMap: WorkspaceGitHubIntegrationPayloadNodeMap) => {
			console.log(removePayloadMap);
			setPayloadMaps((prev) =>
				prev.filter(
					(payloadMap) =>
						payloadMap.payload !== removePayloadMap.payload ||
						payloadMap.nodeId !== removePayloadMap.nodeId,
				),
			);
		},
		[],
	);
	const payloadMapsForRender = useMemo(() => {
		const payloadMapsForRender: Array<
			WorkspaceGitHubIntegrationPayloadNodeMap & { nodeName: string }
		> = [];
		for (const payloadMap of payloadMaps) {
			const node = nodes.find((node) => node.id === payloadMap.nodeId);
			if (node) {
				payloadMapsForRender.push({
					...payloadMap,
					nodeName: getDisplayName(node),
				});
			}
		}
		return payloadMapsForRender;
	}, [payloadMaps, nodes]);

	const showNewPayloadFields = useMemo(
		() => showNewPayloadFieldsFlag || payloadMaps.length === 0,
		[showNewPayloadFieldsFlag, payloadMaps],
	);
	return (
		<div className="flex flex-col gap-[8px]">
			<div className="grid grid-cols-[200px_20px_200px] gap-x-[8px] gap-y-[8px]">
				<Label>Event data </Label>
				<div />
				<Label>Node </Label>
				{payloadMapsForRender.map((payloadMap) => (
					<div
						key={`${payloadMap.payload}-${payloadMap.nodeId}`}
						className="group col-span-3 grid grid-cols-[200px_20px_200px] gap-[8px] items-center h-[28px] bg-black-750 rounded-[8px] text-[14px] border-[1px] border-white-950/10"
					>
						<p className="w-[200px] px-[12px]">
							{payloadMap.payload.split(".").splice(2).join(".")}
						</p>
						<div className="w-[20px] flex justify-center text-primary-800">
							→
						</div>
						<div className="w-[200px] px-[12px] flex items-center justify-between ">
							<p className="truncate">{payloadMap.nodeName}</p>
							<button
								type="button"
								className="p-[2px] rounded-[4px] hover:bg-white-950/10 cursor-pointer hidden group-hover:block"
								onClick={() => removePayloadMap(payloadMap)}
							>
								<TrashIcon className="size-[14px] text-white-400" />
							</button>
						</div>
					</div>
				))}
				{showNewPayloadFields && (
					<>
						<fieldset className="flex flex-col gap-[4px]">
							<Select
								value={selectedPayload}
								onValueChange={(value) =>
									setSelectedPayload(
										WorkspaceGitHubIntegrationPayloadField.parse(value),
									)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select a payload" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationPayloadField.Enum[
												"github.issue_comment.body"
											]
										}
									>
										issue_comment.body
									</SelectItem>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationPayloadField.Enum[
												"github.issue_comment.issue.title"
											]
										}
									>
										issue_comment.issue.title
									</SelectItem>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationPayloadField.Enum[
												"github.issue_comment.issue.body"
											]
										}
									>
										issue_comment.issue.body
									</SelectItem>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationPayloadField.Enum[
												"github.pull_request_comment.body"
											]
										}
									>
										pull_request_comment.body
									</SelectItem>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationPayloadField.Enum[
												"github.pull_request_comment.pull_request.title"
											]
										}
									>
										pull_request_comment.pull_request.title
									</SelectItem>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationPayloadField.Enum[
												"github.pull_request_comment.body"
											]
										}
									>
										pull_request_comment.pull_request.body
									</SelectItem>
									<SelectItem
										value={
											WorkspaceGitHubIntegrationPayloadField.Enum[
												"github.pull_request_comment.pull_request.diff"
											]
										}
									>
										pull_request_comment.pull_request.diff
									</SelectItem>
								</SelectContent>
							</Select>
						</fieldset>
						<p className="text-primary-800 text-[16px] flex justify-center">
							→
						</p>
						<fieldset className="flex flex-col gap-[4px]">
							<Select
								value={selectedNodeId}
								onValueChange={(value) =>
									setSelectedNodeId(NodeId.parse(value))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select a node" />
								</SelectTrigger>
								<SelectContent>
									{nodes.map((node) => (
										<SelectItem key={node.id} value={node.id}>
											{getDisplayName(node)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</fieldset>
					</>
				)}
				<input
					type="hidden"
					name="payloadMaps"
					defaultValue={JSON.stringify(payloadMaps)}
				/>
			</div>
			{!showNewPayloadFields && (
				<div className="flex justify-end px-[8px]">
					<button
						type="button"
						className="flex items-center gap-[8px] cursor-pointer"
						onClick={() => setShowNewPayloadFieldsFlag(true)}
					>
						<p className="text-[14px] text-black-400">Add data mapping</p>
						<div className="flex items-center justify-center size-[20px] bg-primary-200 rounded-full p-[2px]">
							<PlusIcon className="text-black-900" />
						</div>
					</button>
				</div>
			)}
		</div>
	);
}
