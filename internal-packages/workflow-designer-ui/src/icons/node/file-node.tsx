import type { FileNode } from "@giselle-sdk/data-type";
import type { SVGProps } from "react";
import { PdfFileIcon } from "../pdf-file";
import { PictureIcon } from "../picture";
import { TextFileIcon } from "../text-file";

export function FileNodeIcon({
	node,
	...props
}: {
	node: FileNode;
} & SVGProps<SVGSVGElement>) {
	switch (node.content.category) {
		case "pdf":
			return <PdfFileIcon {...props} />;
		case "text":
			return <TextFileIcon {...props} />;
		case "image":
			return <PictureIcon {...props} />;
		default: {
			const _exhaustiveCheck: never = node.content.category;
			throw new Error(`Unhandled node type: ${_exhaustiveCheck}`);
		}
	}
}
