import type { LanguageModel, Tier } from "@giselles-ai/language-model";
import type { Node } from "@giselles-ai/protocol";
import clsx from "clsx/lite";
import type { AddNodeTool } from "../../types";
import { ProTag } from "../components";
import { createModelClickHandler, isProModelForFreeUser } from "./model-utils";
import { ProviderIcon } from "./provider-icon";

interface ModelButtonProps {
	model: LanguageModel;
	userTier: Tier;
	setSelectedTool: (tool: AddNodeTool) => void;
	addNodeTool: (node: Node) => AddNodeTool;
	onMouseEnter: (model: LanguageModel) => void;
	onMouseLeave: () => void;
}

export function ModelButton({
	model,
	userTier,
	setSelectedTool,
	addNodeTool,
	onMouseEnter,
	onMouseLeave,
}: ModelButtonProps) {
	const isProForFreeUser = isProModelForFreeUser(model, userTier);
	const handleClick = createModelClickHandler(
		model,
		userTier,
		setSelectedTool,
		addNodeTool,
	);

	return (
		<button
			type="button"
			className={clsx(
				"flex gap-[12px] items-center p-[4px] rounded-[4px]",
				isProForFreeUser
					? "opacity-50 cursor-not-allowed"
					: "hover:bg-bg-850/10 focus:bg-bg-850/10 cursor-pointer",
			)}
			onClick={handleClick}
			onMouseEnter={() => onMouseEnter(model)}
			onMouseLeave={onMouseLeave}
		>
			<div className="flex items-center">
				<ProviderIcon model={model} />
			</div>
			<div className="flex items-center gap-[8px]">
				<p className="text-[14px] text-left text-nowrap">{model.id}</p>
				{model.tier === "pro" && <ProTag />}
			</div>
		</button>
	);
}
