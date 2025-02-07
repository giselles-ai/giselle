import { DocumentIcon } from "@giselles-ai/icons/document";
import { GlobeIcon } from "@giselles-ai/icons/globe";
import { PromptIcon } from "@giselles-ai/icons/prompt";
import { TextGenerationIcon } from "@giselles-ai/icons/text-generation";
import { SiGithub } from "@icons-pack/react-simple-icons";
import type { SVGProps } from "react";
import type { Node } from "../types";

type ContentTypeIconProps = SVGProps<SVGSVGElement> & {
	contentType: Node["content"]["type"];
};
export function ContentTypeIcon({
	contentType,
	...props
}: ContentTypeIconProps) {
	switch (contentType) {
		case "textGeneration":
			return <TextGenerationIcon {...props} />;
		case "webSearch":
			return <GlobeIcon {...props} />;
		case "text":
			return <PromptIcon {...props} />;
		case "file":
			return <DocumentIcon {...props} />;
		case "files":
			return <DocumentIcon {...props} />;
		case "github":
			return <SiGithub {...props} />;
		default:
			throw new Error(contentType satisfies never);
	}
}
