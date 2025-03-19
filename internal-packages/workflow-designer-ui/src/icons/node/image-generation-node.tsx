import { getImageGenerationModelProvider } from "@giselle-sdk/language-model";
import type { SVGProps } from "react";
import { Flux1Icon } from "../flux1";
import { IdegramIcon } from "../ideogram";
import { RecraftIcon } from "../recraft";
import { StableDiffusionIcon } from "../stable-diffusion";

export function ImageGenerationNodeIcon({
	modelId,
	...props
}: {
	modelId: string;
} & SVGProps<SVGSVGElement>) {
	const imageModelProvider = getImageGenerationModelProvider(modelId);
	if (imageModelProvider === undefined) {
		return null;
	}
	switch (imageModelProvider) {
		case "flux":
			return <Flux1Icon {...props} data-content-type-icon />;
		case "recraft":
			return <RecraftIcon {...props} data-content-type-icon />;
		case "ideogram":
			return <IdegramIcon {...props} data-content-type-icon />;
		case "stable-diffusion":
			return <StableDiffusionIcon {...props} data-content-type-icon />;
		default: {
			const _exhaustiveCheck: never = imageModelProvider;
			throw new Error(`Unhandled ImageModelProvider: ${_exhaustiveCheck}`);
		}
	}
}
