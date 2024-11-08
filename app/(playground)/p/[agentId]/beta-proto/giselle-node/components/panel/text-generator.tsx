import clsx from "clsx";
import { CopyIcon } from "lucide-react";
import type { FC } from "react";
import type {
	GeneratedObject,
	PartialGeneratedObject,
} from "../../../artifact/types";
import {
	Dialog,
	DialogContent,
	DialogTrigger,
} from "../../../components/dialog";
import { PanelCloseIcon } from "../../../components/icons/panel-close";
import { SpinnerIcon } from "../../../components/icons/spinner";
import { WilliIcon } from "../../../components/icons/willi";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "../../../components/select";
import { Spinner } from "../../../components/spinner";
import { useFeatureFlags } from "../../../feature-flags/context";
import { useGraph } from "../../../graph/context";
import { updateNode } from "../../../graph/v2/composition/update-node";
import {
	type GiselleNode,
	giselleNodeCategories,
	giselleNodeState,
	panelTabs,
} from "../../types";
import { ArchetypeIcon } from "../archetype-icon";
import { TabTrigger } from "../tabs";
import { ArtifactBlock } from "./artifact-block";
import { MarkdownRender } from "./markdown-render";

function PopPopWillis() {
	return (
		<div className="flex gap-[16px]">
			<WilliIcon className="w-[24px] h-[24px] fill-black-40 animate-[pop-pop_2.1s_steps(1)_infinite]" />
			<WilliIcon className="w-[24px] h-[24px] fill-black-40 animate-[pop-pop_2.1s_steps(1)_0.7s_infinite]" />
			<WilliIcon className="w-[24px] h-[24px] fill-black-40 animate-[pop-pop_2.1s_steps(1)_1.4s_infinite]" />
		</div>
	);
}

type TextGeneratorPropertyPanelProps = {
	node: GiselleNode;
};
export const TextGeneratorPropertyPanel: FC<
	TextGeneratorPropertyPanelProps
> = ({ node }) => {
	const { dispatch } = useGraph();
	const { chooseModelFlag, anthropicFlag } = useFeatureFlags();
	return (
		<div className="flex gap-[10px] flex-col h-full">
			<div className="relative z-10 pt-[16px] px-[24px] flex justify-between h-[40px]">
				<button type="button">
					<PanelCloseIcon className="w-[18px] h-[18px] fill-black-30" />
				</button>
				<div className="gap-[16px] flex items-center">
					{chooseModelFlag && (
						<TabTrigger value="property">Property</TabTrigger>
					)}
					<TabTrigger value="result">Result</TabTrigger>
				</div>
			</div>
			<div className="bg-black-80 px-[24px] py-[8px] flex items-center justify-between">
				<div className="flex items-center gap-[8px]">
					<div
						className={clsx(
							"rounded-[2px] flex items-center justify-center px-[4px] py-[4px]",
							node.category === giselleNodeCategories.action &&
								"bg-[hsla(187,71%,48%,1)]",
							node.category === giselleNodeCategories.instruction && "bg-white",
						)}
					>
						<ArchetypeIcon
							archetype={node.archetype}
							className="w-[14px] h-[14px] fill-black-100"
						/>
					</div>
					<div className="font-avenir text-[16px] text-black-30">
						{node.archetype}
					</div>
				</div>
			</div>

			{chooseModelFlag && node.ui.panelTab === panelTabs.property && (
				<div className="px-[24px] pb-[16px] overflow-scroll">
					<div>
						<div className="relative z-10">
							<div className="grid gap-[8px]">
								<label
									htmlFor="text"
									className="font-rosart text-[16px] text-black-30"
								>
									LLM
								</label>
								<Select
									value={
										(node.properties.llm as string) ?? "openai:gpt-4o-mini"
									}
									onValueChange={(value) => {
										dispatch(
											updateNode({
												input: {
													nodeId: node.id,
													properties: {
														...node.properties,
														llm: value,
													},
												},
											}),
										);
									}}
								>
									<SelectTrigger className="w-[280px]">
										<SelectValue placeholder="Select a timezone" />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectLabel>OpenAI</SelectLabel>
											<SelectItem value="openai:gpt-4o">gpt-4o</SelectItem>
											<SelectItem value="openai:gpt-4o-mini">
												gpt-4o-mini
											</SelectItem>
										</SelectGroup>
										{anthropicFlag && (
											<SelectGroup>
												<SelectLabel>Anthropic </SelectLabel>
												<SelectItem value="anthropic:claude-3.5-sonnet">
													Claude 3.5 Sonnet
												</SelectItem>
											</SelectGroup>
										)}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
				</div>
			)}
			{node.ui.panelTab === panelTabs.result && (
				<div className="px-[24px] pb-[16px] overflow-y-auto overflow-x-hidden text-black-30 font-rosart text-[12px]">
					<div className="flex flex-col gap-[8px]">
						{node.state === giselleNodeState.inProgress && (
							<div className="flex justify-center mt-[120px]">
								<div className="flex flex-col gap-[36px]">
									<p className="text-black-30 font-rosart text-[18px]">
										Generating...
									</p>
									<PopPopWillis />
								</div>
							</div>
						)}
						<div>{(node.output as PartialGeneratedObject).thinking}</div>
						{(node.output as PartialGeneratedObject).artifact?.content && (
							<div>
								<ArtifactBlock
									title={
										(node.output as PartialGeneratedObject).artifact?.title
									}
									content={
										(node.output as PartialGeneratedObject).artifact?.content
									}
									completed={
										(node.output as PartialGeneratedObject).artifact?.completed
									}
									citations={
										(node.output as PartialGeneratedObject).artifact?.citations
									}
									node={node}
								/>
							</div>
						)}
						<div>{(node.output as PartialGeneratedObject).description}</div>
					</div>
				</div>
			)}
		</div>
	);
};
