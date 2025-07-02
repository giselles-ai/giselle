import type { TextGenerationNode } from "@giselle-sdk/data-type";
import {
	useGiselleEngine,
	useWorkflowDesigner,
} from "@giselle-sdk/giselle-engine/react";
import { CheckIcon, DatabaseIcon, TrashIcon } from "lucide-react";
import { Switch } from "../../../../ui/switch";

const _POSTGRES_TOOL_CATEGORIES = [
	{
		label: "Schema",
		tools: ["getTableStructure"],
	},
	{
		label: "Query",
		tools: ["query"],
	},
];

export function PostgresToolsPanel({ node }: { node: TextGenerationNode }) {
	const { updateNodeDataContent, data } = useWorkflowDesigner();
	const client = useGiselleEngine();

	const toolsEnabled = !!node.content.tools?.postgres;
	const selectedTools = node.content.tools?.postgres?.tools || [];

	const handleToolToggle = (toolName: string) => {
		if (!node.content.tools?.postgres) return;

		const tools = selectedTools.includes(toolName)
			? selectedTools.filter((t) => t !== toolName)
			: [...selectedTools, toolName];

		updateNodeDataContent(node, {
			...node.content,
			tools: {
				...node.content.tools,
				postgres: {
					...node.content.tools.postgres,
					tools,
				},
			},
		});
	};

	return (
		<div className="flex flex-col gap-[12px]">
			<div className="flex items-center gap-[8px]">
				<DatabaseIcon className="size-[20px] text-white-900" />
				<div className="text-[14px]">Postgres Tools</div>
			</div>
			{!toolsEnabled && (
				<form
					className="bg-white-800/10 text-white-800 rounded-[4px] px-[12px] py-[8px] text-[12px] flex flex-col gap-[4px]"
					onSubmit={async (e) => {
						e.preventDefault();
						const formData = new FormData(e.currentTarget);
						const connectionString = formData.get("connectionString");
						if (
							typeof connectionString !== "string" ||
							connectionString.length < 36
						) {
							alert("Invalid Connection String");
							return;
						}
						const result = await client.addSecret({
							workspaceId: data.id,
							label: "test",
							value: connectionString,
						});

						updateNodeDataContent(node, {
							...node.content,
							tools: {
								...node.content.tools,
								postgres: {
									secretId: result.secret.id,
									tools: [],
								},
							},
						});
					}}
				>
					<p>To use Postgres Tool, you need an connection string:</p>
					<ul className="list-disc list-inside">
						<li>
							Paste your connection string below and hit enter to start using
							the Postgres Tools
						</li>
					</ul>
					<input
						type="text"
						name="connectionString"
						className="border border-black-300 rounded-[4px] px-[4px] py-[4px] outline-none"
						placeholder="postgres://default"
					/>
					<button
						type="submit"
						className="h-[28px] rounded-[8px] bg-white-800 text-[14px] cursor-pointer text-black-800 font-[700] px-[16px] font-accent mt-[8px]"
					>
						Set up
					</button>
				</form>
			)}
			{toolsEnabled && (
				<div className="bg-white-800/10 text-white-800 rounded-[4px] px-[12px] py-[8px] text-[12px] flex flex-col">
					<div className="flex justify-between items-center">
						<div className="flex gap-[6px] items-center">
							<CheckIcon className="size-[14px] text-green-900" />
							Tool configured.
						</div>
						<button
							type="button"
							className="text-white-800 flex items-center gap-[4px] cursor-pointer p-[2px] hover:bg-white-800/20 rounded-[4px] transition-colors"
							onClick={() => {
								updateNodeDataContent(node, {
									...node.content,
									tools: {
										...node.content.tools,
										postgres: undefined,
									},
								});
							}}
						>
							<TrashIcon className="size-[12px]" />
							Reset key
						</button>
					</div>
					<div className="border-t border-white-800/10 my-[8px]" />

					<div>
						<div className="flex flex-col gap-[16px]">
							<div className="flex flex-col gap-[8px]">
								<div className="grid grid-cols-2 gap-[8px]">
									<div className="flex items-center space-x-2 p-[4px] hover:bg-black-800/30 rounded-[4px]">
										<Switch
											name="getTableStructure"
											label="getTableStructure"
											checked={selectedTools.includes("getTableStructure")}
											onCheckedChange={() =>
												handleToolToggle("getTableStructure")
											}
										/>
									</div>
									<div className="flex items-center space-x-2 p-[4px] hover:bg-black-800/30 rounded-[4px]">
										<Switch
											name="query"
											label="query"
											checked={selectedTools.includes("query")}
											onCheckedChange={() => handleToolToggle("query")}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
