import {
	type OverrideVariableNode,
	type Workflow,
	isTextNode,
} from "@giselle-sdk/data-type";
import { TextEditor } from "@giselle-sdk/text-editor/react-internal";
import clsx from "clsx/lite";
import { useRunController } from "giselle-sdk/react";
import { Tabs } from "radix-ui";
import { type FormEventHandler, useCallback, useState } from "react";
import { NodeIcon } from "../icons/node";
import { Button } from "../ui/button";

export function RunWithOverrideParamsForm({ flow }: { flow: Workflow }) {
	const { perform } = useRunController();
	// Track the currently selected node
	const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
	const [overrideVariableNodes, setOverrideVariableNodes] = useState<
		OverrideVariableNode[]
	>(
		flow.nodes
			.map((node) =>
				isTextNode(node)
					? ({
							id: node.id,
							type: "variable",
							content: {
								type: "text",
								text: node.content.text,
							},
						} satisfies OverrideVariableNode)
					: null,
			)
			.filter((node) => node !== null),
	);

	// Active node change handler
	const handleNodeSelect = useCallback((nodeId: string) => {
		console.log("Node selected:", nodeId);
		setActiveNodeId(nodeId);
	}, []);

	const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
		(e) => {
			e.preventDefault();
			perform(flow.id, {
				overrideNodes: overrideVariableNodes,
			});
		},
		[flow.id, perform, overrideVariableNodes],
	);
	return (
		<div className="flex flex-col h-full">
			<div className="flex justify-between items-center mb-[24px]">
				<h2 className="font-accent text-[18px] font-bold text-primary-100 drop-shadow-[0_0_10px_#0087F6]">
					Override inputs to test workflow
				</h2>
			</div>
			<form
				className="flex-1 flex flex-col gap-[24px] relative text-white-800 overflow-y-hidden"
				onSubmit={handleSubmit}
			>
				<Tabs.Root
					className="flex flex-row gap-[24px] flex-1 overflow-hidden h-[calc(100%-60px)]"
					defaultValue={overrideVariableNodes?.[0]?.id}
				>
					{/* Left side: Node list */}
					<Tabs.List className="w-[250px] overflow-y-auto pr-[8px] h-full">
						<h3 className="text-[12px] mb-[8px] text-black-400 font-hubot font-semibold">
							Input information
						</h3>
						<div className="flex flex-col gap-[8px]">
							{overrideVariableNodes.map((overrideNode) => {
								// Find original node (for icon and name)
								const originalNode = flow.nodes.find(
									(node) => node.id === overrideNode.id,
								);
								if (!originalNode) return null;

								return (
									<Tabs.Trigger
										key={overrideNode.id}
										value={overrideNode.id}
										className={clsx(
											"flex items-center p-[12px] rounded-[8px] border cursor-pointer transition-all duration-200 w-full text-left",
											"data-[state=active]:border-primary-900 data-[state=active]:bg-black-800/30",
											"data-[state=inactive]:border-black-400/40 data-[state=inactive]hover:border-primary-900/50 data-[state=inactive]:hover:bg-black-800/10",
										)}
										onClick={() => handleNodeSelect(overrideNode.id)}
										aria-pressed={activeNodeId === overrideNode.id}
										type="button"
									>
										{/* Node icon (using original icon) */}
										<div className="flex items-center justify-center w-[36px] h-[36px] mr-[12px] rounded-[4px] bg-white-950 text-black-950">
											<NodeIcon node={originalNode} className="size-[20px]" />
										</div>

										{/* Node name */}
										<div className="flex-1">
											<p className="text-[14px] font-medium text-white-900">
												{originalNode.name || "Unnamed Node"}
											</p>
											<div className="flex items-center gap-1 mt-1">
												<svg
													width="10"
													height="10"
													viewBox="0 0 24 24"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
													className="text-black-400"
													aria-hidden="true"
												>
													<title>Link icon</title>
													<path
														d="M6.56961 16.0501C6.76961 16.2501 7.01961 16.3401 7.27961 16.3401C7.53961 16.3401 7.78961 16.2401 7.98961 16.0501L15.9196 8.1201C16.3096 7.7301 16.3096 7.1001 15.9196 6.7101C15.5296 6.3201 14.8996 6.3201 14.5096 6.7101L6.57961 14.6401C6.18961 15.0301 6.18961 15.6601 6.57961 16.0501H6.56961Z"
														fill="currentColor"
													/>
													<path
														d="M19.6298 2.98009C17.3598 0.710088 13.6698 0.710088 11.3998 2.98009L8.2098 6.17009H8.2198C7.8698 6.57009 7.8698 7.17009 8.2498 7.55009C8.6298 7.93009 9.2298 7.93009 9.6198 7.58009L9.6498 7.56009L12.7998 4.41009C14.2898 2.92009 16.7098 2.92009 18.1998 4.41009C19.6898 5.90009 19.6898 8.32009 18.1998 9.81009L15.0098 13.0001H15.0198C14.6698 13.4001 14.6698 14.0001 15.0498 14.3801C15.4298 14.7601 16.0298 14.7601 16.4198 14.4101L16.4498 14.3801L19.6098 11.2201C21.8798 8.95009 21.8798 5.26009 19.6098 2.99009L19.6298 2.98009Z"
														fill="currentColor"
													/>
													<path
														d="M14.5798 14.8601C14.2198 14.5001 13.6698 14.4901 13.2798 14.7801L13.2598 14.7601L10.2698 17.7501C8.77981 19.2401 6.35981 19.2401 4.8698 17.7501C3.3798 16.2601 3.3798 13.8401 4.8698 12.3501L7.7598 9.46006L7.8498 9.37006L7.82981 9.35006C8.12981 8.96006 8.10981 8.41006 7.74981 8.05006C7.38981 7.69006 6.83981 7.68006 6.44981 7.97006L6.42981 7.95006L3.4398 10.9401C1.1698 13.2101 1.1698 16.9001 3.4398 19.1701C5.7098 21.4401 9.3998 21.4401 11.6698 19.1701L14.5598 16.2801L14.6498 16.1901L14.6298 16.1701C14.9298 15.7801 14.9098 15.2301 14.5498 14.8701L14.5798 14.8601Z"
														fill="currentColor"
													/>
												</svg>
												<span className="text-[10px] text-black-400">
													Connected node
												</span>
											</div>
										</div>
									</Tabs.Trigger>
								);
							})}
						</div>
					</Tabs.List>

					{/* Right side: Text editor */}

					{overrideVariableNodes.map(
						(overrideNode) =>
							overrideNode.content.type === "text" && (
								<Tabs.Content
									value={overrideNode.id}
									className="flex-1 h-full"
									key={overrideNode.id}
								>
									<div className="w-full h-full [&_.prompt-editor]:text-white [&_svg]:text-white [&_button]:text-white">
										<TextEditor
											value={overrideNode.content.text}
											onValueChange={(value) => {
												setOverrideVariableNodes((prevOverrideVariableNodes) =>
													prevOverrideVariableNodes.map(
														(prevOverrideVariableNode) =>
															prevOverrideVariableNode.id === overrideNode.id
																? {
																		id: prevOverrideVariableNode.id,
																		type: prevOverrideVariableNode.type,
																		content: {
																			type: "text",
																			text: value,
																		},
																	}
																: prevOverrideVariableNode,
													),
												);
											}}
										/>
									</div>
								</Tabs.Content>
							),
					)}
				</Tabs.Root>
				<div className="flex justify-end">
					<Button type="submit">Run with params</Button>
				</div>
			</form>
		</div>
	);
}
