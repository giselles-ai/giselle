import {
	getEntry,
	hasTierAccess,
	type LanguageModelId,
	type LanguageModelTier,
} from "@giselles-ai/language-model-registry";
import clsx from "clsx/lite";
import { ProTag } from "../components";
import { ProviderIcon } from "./provider-icon";

export function LanguageModelItemButton({
	userTier,
	modelId,
	...props
}: {
	userTier: LanguageModelTier;
	modelId: LanguageModelId;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
	const languageModel = getEntry(modelId);
	const hasRequiredTier = hasTierAccess(userTier, languageModel.requiredTier);
	return (
		<button
			type="button"
			{...props}
			className={clsx(
				"flex gap-[12px] items-center p-[4px] rounded-[4px]",
				hasRequiredTier
					? "hover:bg-bg-850/10 focus:bg-bg-850/10 cursor-pointer"
					: "opacity-50 cursor-not-allowed",
			)}
		>
			<div className="flex items-center">
				<ProviderIcon modelId={modelId} />
			</div>
			<div className="flex items-center gap-[8px]">
				<p className="text-[14px] text-left text-nowrap">
					{languageModel.name}
				</p>
				{languageModel.requiredTier === "pro" && <ProTag />}
			</div>
		</button>
	);
}
