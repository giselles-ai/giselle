"use client";

import { FileCategory } from "@giselle-sdk/data-type";
import {
	type ActionProvider,
	type TriggerProvider,
	actionProviders,
	triggerProviders,
} from "@giselle-sdk/flow";
import {
	actionNodeDefaultName,
	createActionNode,
	createFileNode,
	createTriggerNode,
	triggerNodeDefaultName,
} from "@giselle-sdk/node-utils";
import { Menubar } from "radix-ui";
import { addNodeTool, selectFileNodeCategoryTool, useToolbar } from "./state";

export function Toolbar() {
	const { setSelectedTool } = useToolbar();

	return (
		<Menubar.Root className="flex gap-2 rounded-md bg-black-900/10 p-2">
			<Menubar.Menu>
				<Menubar.Trigger className="px-3 py-1">Add Node</Menubar.Trigger>
				<Menubar.Content className="min-w-[200px] rounded-md bg-white p-2 shadow">
					<Menubar.Sub>
						<Menubar.SubTrigger className="px-2 py-1 rounded hover:bg-black-100">
							Trigger
						</Menubar.SubTrigger>
						<Menubar.Content className="min-w-[180px] rounded-md bg-white p-2 shadow">
							{triggerProviders.map((provider) => (
								<Menubar.Item
									key={provider}
									className="px-2 py-1 rounded hover:bg-black-100"
									onClick={() =>
										setSelectedTool(addNodeTool(createTriggerNode(provider)))
									}
								>
									{triggerNodeDefaultName(provider)}
								</Menubar.Item>
							))}
						</Menubar.Content>
					</Menubar.Sub>
					<Menubar.Sub>
						<Menubar.SubTrigger className="px-2 py-1 rounded hover:bg-black-100">
							Action
						</Menubar.SubTrigger>
						<Menubar.Content className="min-w-[180px] rounded-md bg-white p-2 shadow">
							{actionProviders.map((provider) => (
								<Menubar.Item
									key={provider}
									className="px-2 py-1 rounded hover:bg-black-100"
									onClick={() =>
										setSelectedTool(
											addNodeTool(createActionNode(provider as ActionProvider)),
										)
									}
								>
									{actionNodeDefaultName(provider)}
								</Menubar.Item>
							))}
						</Menubar.Content>
					</Menubar.Sub>
					<Menubar.Sub>
						<Menubar.SubTrigger className="px-2 py-1 rounded hover:bg-black-100">
							File
						</Menubar.SubTrigger>
						<Menubar.Content className="min-w-[180px] rounded-md bg-white p-2 shadow">
							{Object.values(FileCategory).map((cat) => (
								<Menubar.Item
									key={cat}
									className="px-2 py-1 rounded hover:bg-black-100"
									onClick={() =>
										setSelectedTool(addNodeTool(createFileNode(cat)))
									}
								>
									{cat}
								</Menubar.Item>
							))}
						</Menubar.Content>
					</Menubar.Sub>
				</Menubar.Content>
			</Menubar.Menu>
			<Menubar.Menu>
				<Menubar.Trigger className="px-3 py-1">Tools</Menubar.Trigger>
				<Menubar.Content className="min-w-[150px] rounded-md bg-white p-2 shadow">
					<Menubar.Item
						className="px-2 py-1 rounded hover:bg-black-100"
						onClick={() => setSelectedTool(selectFileNodeCategoryTool())}
					>
						Select File Category
					</Menubar.Item>
				</Menubar.Content>
			</Menubar.Menu>
		</Menubar.Root>
	);
}
