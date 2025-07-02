"use client";

import {
	ArrowRightIcon,
	ChevronUpIcon,
	FileCode2Icon,
	FileSearchIcon,
	FlagTriangleRightIcon,
	HandIcon,
	MousePointer2Icon,
	PanelLeftIcon,
	PanelRightIcon,
	PlayIcon,
	SparkleIcon,
	SparklesIcon,
	StarIcon,
	TextIcon,
	WorkflowIcon,
} from "lucide-react";
import "@xyflow/react/dist/style.css";
import {
	Background,
	Panel,
	ReactFlow,
	ReactFlowProvider,
	SelectionMode,
} from "@xyflow/react";
import { useState } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { type AppNode, nodeTypes } from "./components/custom-node";
import { NodeSelector } from "./components/node-selector";
import { Spinner } from "./components/spinner";
import { TabContent, TabProvider, TabTrigger } from "./components/tab";
import { DnDProvider } from "./contexts/drag-and-drop";

const initialNodes: AppNode[] = [
	{
		id: "1",
		position: { x: 20, y: 20 },
		data: { label: "hello" },
		type: "trigger",
	},
	{
		id: "2",
		position: { x: 400, y: 100 },
		data: { label: "2" },
		type: "text-generation",
	},
	{
		id: "3",
		position: { x: 200, y: 200 },
		data: { label: "2" },
		type: "text",
	},
	{
		id: "4",
		position: { x: 800, y: 100 },
		data: { label: "2" },
		type: "response",
	},
];
const initialEdges = [
	{ id: "e1-2", source: "1", target: "2" },
	{
		id: "e2-3",
		source: "3",
		sourceHandle: "text",
		target: "2",
		targetHandle: "inst",
	},
	{
		id: "e2-4",
		source: "2",
		target: "4",
	},
	{
		id: "e3-4",
		source: "2",
		sourceHandle: "tgr",
		target: "4",
		targetHandle: "val",
	},
];

function Inner() {
	const [sideMenu, setSideMenu] = useState(false);
	const [leftSideMenu, setLeftSideMenu] = useState(false);
	return (
		<div className="text-rosepine-text h-screen w-full bg-rosepine-highlightMed p-4 flex gap-4">
			<div className="py-2 flex flex-col gap-4 text-sm">
				<button
					type="button"
					className="p-0.5 hover:bg-rosepine-highlightMed rounded-sm"
					onClick={() => {
						setLeftSideMenu((prev) => !prev);
					}}
				>
					<PanelLeftIcon size={18} strokeWidth={1} />
				</button>
				{leftSideMenu && (
					<>
						<div className="space-y-1">
							<div>Details</div>
							<div className="h-[100px] bg-rosepine-muted rounded" />
						</div>
						<div className="space-y-1">
							<div>Knowledges</div>
							<div className="h-[100px] bg-rosepine-muted rounded" />
						</div>
						<div className="space-y-1">
							<div>Preview History</div>
							<ul className="text-rosepine-muted">
								<li className="hover:underline hover:text-rosepine-text cursor-pointer">
									Preview 20240917 10:00
								</li>
								<li className="hover:underline hover:text-rosepine-text cursor-pointer">
									Preview 20240917 8:45
								</li>
							</ul>
						</div>
					</>
				)}
			</div>
			<div className="border border-rosepine-highlightHigh bg-rosepine-base h-full rounded-md overflow-hidden flex flex-col flex-1">
				<TabProvider>
					<div className="flex bg-rosepine-surface border-b border-rosepine-highlightMed text-sm justify-between text-rosepine-subtle">
						<div className="flex">
							<TabTrigger
								value="Agent Graph"
								className="px-4 py-1.5 border-r border-rosepine-highlightMed border-b border-b-rosepine-base -mb-0.5 data-[state=active]:bg-rosepine-base data-[state=active]:text-rosepine-text"
							>
								<WorkflowIcon size={20} strokeWidth={1} />
							</TabTrigger>
							<TabTrigger
								value="preview"
								className="px-4 py-1.5 border-r border-rosepine-highlightMed border-b border-b-rosepine-base -mb-0.5  data-[state=active]:bg-rosepine-base  data-[state=active]:text-rosepine-text flex gap-2 items-center"
							>
								Preview
								<span className="text-rosepine-muted text-[10px]">
									Waiting input
								</span>
							</TabTrigger>
							<TabTrigger
								value="preview1"
								className="px-4 py-1.5 border-r border-rosepine-highlightMed border-b border-b-rosepine-base -mb-0.5  data-[state=active]:bg-rosepine-base  data-[state=active]:text-rosepine-text flex gap-2 items-center"
							>
								Preview
								<span className="text-rosepine-muted text-[10px]">
									20240917 10:00
								</span>
							</TabTrigger>
							<TabTrigger
								value="preview2"
								className="px-4 py-1.5 border-r border-rosepine-highlightMed border-b border-b-rosepine-base -mb-0.5  data-[state=active]:bg-rosepine-base  data-[state=active]:text-rosepine-text flex gap-2 items-center"
							>
								Preview
								<span className="text-rosepine-muted text-[10px]">
									20240917 8:45
								</span>
							</TabTrigger>
						</div>
						{!sideMenu && (
							<div className="border-l flex items-center px-1">
								<button
									type="button"
									className="p-0.5 hover:bg-rosepine-highlightMed rounded-sm"
									onClick={() => {
										setSideMenu(true);
									}}
								>
									<PanelRightIcon size={18} strokeWidth={1} />
								</button>
							</div>
						)}
					</div>
					<TabContent value="Agent Graph" className="h-full">
						<div className="h-full flex flex-col">
							<div className="py-1.5 px-3 border-b border-rosepine-highlightMed text-sm text-rosepine-subtle font-medium flex justify-between">
								<div>Agent Graph</div>
								<button
									type="button"
									className="flex items-center gap-1 hover:text-rosepine-text"
								>
									<PlayIcon size={14} strokeWidth={1} />
									<span>Preview</span>
								</button>
							</div>
							<ReactFlow
								defaultNodes={initialNodes}
								defaultEdges={initialEdges}
								nodeTypes={nodeTypes}
								panOnScroll
								selectionOnDrag
								panOnDrag={[1, 2]}
								selectionMode={SelectionMode.Partial}
								colorMode="dark"
							>
								<Background className="bg-rosepine-base/20!" />
								<Panel position={"bottom-center"}>
									<div className="border border-rosepine-highlightMed rounded-md bg-rosepine-surface flex divide-x divide-rosepine-highlightMed items-stretch overflow-hidden">
										<div className="grid divide-y h-full">
											<button
												type="button"
												className="hover:bg-rosepine-highlightLow flex justify-center items-center p-1"
											>
												<MousePointer2Icon size={24} strokeWidth={1} />
											</button>

											<button
												type="button"
												className="hover:bg-rosepine-highlightLow flex justify-center items-center p-1"
											>
												<HandIcon size={24} strokeWidth={1} />
											</button>
										</div>
										<div className="flex items-center px-2">
											<div className="flex gap-2 text-sm">
												<Popover>
													<PopoverTrigger className="rounded  hover:bg-rosepine-highlightLow px-3 py-2 border border-rosepine-highlightMed flex items-center gap-2">
														<span>Action</span>
														<ChevronUpIcon size={14} strokeWidth={1} />
													</PopoverTrigger>
													<PopoverContent sideOffset={24}>
														<div className="flex gap-6">
															<NodeSelector
																className="[&_div.iconBase]:bg-rosepine-foam/20 [&_div.iconWrap]:bg-rosepine-foam/60 [&_div.iconMain]:fill-rosepine-foam/10 [&_div.iconMain]:text-rosepine-surface"
																nodeClassName="text-generation"
																icon={
																	<SparkleIcon
																		size={24}
																		strokeWidth={2}
																		className="fill-rosepine-foam/10 text-white"
																	/>
																}
																label={
																	<div>
																		Text
																		<br />
																		Generation
																	</div>
																}
															/>
															<NodeSelector
																nodeClassName="knowledge-retrieval"
																className="[&_div.iconBase]:bg-rosepine-foam/20 [&_div.iconWrap]:bg-rosepine-foam/60 [&_div.iconMain]:fill-rosepine-foam/10 [&_div.iconMain]:text-rosepine-surface"
																icon={
																	<FileSearchIcon
																		size={24}
																		strokeWidth={2}
																		className="fill-rosepine-foam/10 text-white"
																	/>
																}
																label={
																	<div>
																		Knowledge
																		<br />
																		Retrieval
																	</div>
																}
															/>
															<NodeSelector
																className="[&_div.iconBase]:bg-rosepine-foam/20 [&_div.iconWrap]:bg-rosepine-foam/60 [&_div.iconMain]:fill-rosepine-foam/10 [&_div.iconMain]:text-rosepine-surface"
																nodeClassName="web-scraping"
																icon={
																	<FileCode2Icon
																		size={24}
																		strokeWidth={2}
																		className="fill-rosepine-foam/10 text-white"
																	/>
																}
																label={
																	<div>
																		Web
																		<br />
																		Scraping
																	</div>
																}
															/>

															<NodeSelector
																className="[&_div.iconBase]:bg-rosepine-foam/20 [&_div.iconWrap]:bg-rosepine-foam/60 [&_div.iconMain]:fill-rosepine-foam/10 [&_div.iconMain]:text-rosepine-surface"
																nodeClassName="agent"
																icon={
																	<SparklesIcon
																		size={24}
																		strokeWidth={2}
																		className="fill-rosepine-foam/10 text-white"
																	/>
																}
																label={<div>Agent</div>}
															/>
														</div>
													</PopoverContent>
												</Popover>

												<Popover>
													<PopoverTrigger className="rounded  hover:bg-rosepine-highlightLow px-3 py-2 border border-rosepine-highlightMed flex items-center gap-2">
														<span>Data</span>
														<ChevronUpIcon size={14} strokeWidth={1} />
													</PopoverTrigger>
													<PopoverContent sideOffset={24}>
														<div className="flex gap-6">
															<NodeSelector
																nodeClassName="text-generation"
																className="[&_div.iconBase]:bg-rosepine-gold/20 [&_div.iconWrap]:bg-rosepine-gold/60 [&_div.iconMain]:fill-rosepine-gold/10 [&_div.iconMain]:text-rosepine-surface"
																icon={
																	<TextIcon
																		size={24}
																		strokeWidth={2}
																		className="fill-rosepine-gold/10 text-white"
																	/>
																}
																label={<div>Text</div>}
															/>
														</div>
													</PopoverContent>
												</Popover>
												<Popover>
													<PopoverTrigger className="rounded  hover:bg-rosepine-highlightLow px-3 py-2 border border-rosepine-highlightMed flex items-center gap-2">
														<span>Result</span>
														<ChevronUpIcon size={14} strokeWidth={1} />
													</PopoverTrigger>
													<PopoverContent sideOffset={24}>
														<div className="flex gap-6">
															<NodeSelector
																nodeClassName="text-generation"
																className="[&_div.iconBase]:bg-rosepine-iris/20 [&_div.iconWrap]:bg-rosepine-iris/60 [&_div.iconMain]:fill-rosepine-iris/10 [&_div.iconMain]:text-rosepine-surface"
																icon={
																	<FlagTriangleRightIcon
																		size={24}
																		strokeWidth={2}
																		className="fill-rosepine-iris/10 text-white"
																	/>
																}
																label={<div>Response</div>}
															/>
														</div>
													</PopoverContent>
												</Popover>
											</div>
										</div>
									</div>
								</Panel>
							</ReactFlow>
						</div>
					</TabContent>
					<TabContent value="preview">
						<div className="py-1.5 px-3 border-b border-rosepine-highlightMed text-sm text-rosepine-subtle font-medium flex justify-between">
							<div className="flex gap-2 text-sm items-center">
								<Spinner />
								<span>Build Graph</span>
								<ArrowRightIcon size={14} strokeWidth={1} />
								<span className="text-rosepine-muted">Enter Input</span>
								<ArrowRightIcon size={14} strokeWidth={1} />
								<span className="text-rosepine-muted">Running Graph</span>
							</div>
							<button
								type="button"
								className="flex items-center gap-1 hover:text-rosepine-text"
							>
								<StarIcon size={14} strokeWidth={1} />
							</button>
						</div>
					</TabContent>
				</TabProvider>
			</div>
			{sideMenu && (
				<div className="py-2 px-1 text-sm min-w-[300px] flex flex-col gap-2">
					<div className="flex items-center">
						<p>Properties</p>
						<div className="ml-auto flex items-center px-1">
							<button
								type="button"
								className="p-0.5 hover:bg-rosepine-highlightMed rounded-sm"
								onClick={() => {
									setSideMenu(false);
								}}
							>
								<PanelRightIcon size={18} strokeWidth={1} />
							</button>
						</div>
					</div>
					<div>
						<div className="flex items-center gap-1">
							<SparkleIcon size={18} strokeWidth={1} />
							<p>Text Generation</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default function Page() {
	return (
		<ReactFlowProvider>
			<DnDProvider>
				<Inner />
			</DnDProvider>
		</ReactFlowProvider>
	);
}
