"use client";

import type { Node } from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { CommandIcon, CornerDownLeft } from "lucide-react";
import { Tabs } from "radix-ui";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Button } from "../../../ui/button";
import { KeyboardShortcuts } from "../../components/keyboard-shortcuts";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "./properties-panel";

export interface TabConfig {
	value: string;
	label: string;
	content: ReactNode;
	className?: string;
}

export interface GenerationConfig {
	isGenerating: boolean;
	onGenerate: () => void;
	onStop: () => void;
	generateLabel?: string;
	disabled?: boolean;
	className?: string;
}

export interface TabbedPropertiesPanelProps {
	node: Node;
	icon: ReactNode;
	description?: string;
	onChangeName?: (name?: string) => void;
	tabs: TabConfig[];
	defaultTab?: string;
	bottomPanel?: ReactNode;
	generationConfig?: GenerationConfig;
	enableKeyboardShortcuts?: boolean;
	customAction?: ReactNode;
	disablePadding?: boolean;
}

export function TabbedPropertiesPanel({
	node,
	icon,
	description,
	onChangeName,
	tabs,
	defaultTab,
	bottomPanel,
	generationConfig,
	enableKeyboardShortcuts = true,
	customAction,
	disablePadding = false,
}: TabbedPropertiesPanelProps) {
	const { data, setUiNodeState } = useWorkflowDesigner();

	const uiState = useMemo(() => data.ui.nodeState[node.id], [data, node.id]);

	const handleTabChange = (tab: string) => {
		setUiNodeState(node.id, { tab }, { save: true });
	};

	const handleGenerate = () => {
		if (!generationConfig) return;

		if (generationConfig.isGenerating) {
			generationConfig.onStop();
		} else {
			generationConfig.onGenerate();
		}
	};

	const generateButton = generationConfig && (
		<Button
			variant="ghost"
			loading={generationConfig.isGenerating}
			type="button"
			disabled={generationConfig.disabled}
			onClick={handleGenerate}
			className={clsx(
				"w-[150px] text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 border-0 disabled:cursor-not-allowed disabled:opacity-50",
				generationConfig.className,
			)}
			style={{
				background: "linear-gradient(to top, #1663F3, #0b4299)",
			}}
		>
			{generationConfig.isGenerating ? (
				<span>Stop</span>
			) : (
				<>
					<span>{generationConfig.generateLabel || "Generate"}</span>
					<kbd className="flex items-center text-[12px]">
						<CommandIcon className="size-[12px]" />
						<CornerDownLeft className="size-[12px]" />
					</kbd>
				</>
			)}
		</Button>
	);

	const tabsContent = (
		<Tabs.Root
			className="flex flex-col gap-[8px] h-full"
			value={uiState?.tab ?? defaultTab ?? tabs[0]?.value}
			onValueChange={handleTabChange}
		>
			<Tabs.List
				className={clsx(
					"flex gap-[16px] text-[14px] font-accent",
					"**:p-[4px] **:border-b **:cursor-pointer",
					"**:data-[state=active]:text-white-900 **:data-[state=active]:border-white-900",
					"**:data-[state=inactive]:text-black-400 **:data-[state=inactive]:border-transparent",
				)}
			>
				{tabs.map((tab) => (
					<Tabs.Trigger key={tab.value} value={tab.value}>
						{tab.label}
					</Tabs.Trigger>
				))}
			</Tabs.List>
			{tabs.map((tab) => (
				<Tabs.Content
					key={tab.value}
					value={tab.value}
					className={clsx(
						"flex-1 flex flex-col overflow-hidden outline-none",
						tab.className,
					)}
				>
					{tab.content}
				</Tabs.Content>
			))}
		</Tabs.Root>
	);

	const content = disablePadding ? (
		<div className="flex-1 h-full flex flex-col overflow-hidden pr-[4px]">
			{tabsContent}
		</div>
	) : (
		<PropertiesPanelContent>{tabsContent}</PropertiesPanelContent>
	);

	return (
		<PropertiesPanelRoot>
			<PropertiesPanelHeader
				icon={icon}
				node={node}
				description={description}
				onChangeName={onChangeName}
				action={customAction || generateButton}
			/>

			{bottomPanel ? (
				<PanelGroup direction="vertical" className="flex-1 flex flex-col">
					<Panel>
						<div
							className={clsx(
								"flex-1 h-full flex flex-col overflow-hidden",
								disablePadding ? "pr-[4px]" : "pr-[16px]",
							)}
						>
							{content}
							<div className="h-[4px]" />
						</div>
					</Panel>
					<PanelResizeHandle
						className={clsx(
							"h-[3px] flex items-center justify-center cursor-row-resize",
							"after:content-[''] after:h-[3px] after:w-[32px] after:bg-[#3a3f44] after:rounded-full",
							"hover:after:bg-[#4a90e2]",
						)}
					/>
					<Panel>
						<div
							className={clsx(
								"flex-1 h-full flex flex-col overflow-hidden",
								disablePadding ? "pr-[4px]" : "pr-[16px]",
							)}
						>
							<div className="h-[4px]" />
							{bottomPanel}
							<div className="h-[4px]" />
						</div>
					</Panel>
				</PanelGroup>
			) : (
				content
			)}

			{enableKeyboardShortcuts && generationConfig && (
				<KeyboardShortcuts
					generate={() => {
						if (!generationConfig.isGenerating) {
							generationConfig.onGenerate();
						}
					}}
				/>
			)}
		</PropertiesPanelRoot>
	);
}
