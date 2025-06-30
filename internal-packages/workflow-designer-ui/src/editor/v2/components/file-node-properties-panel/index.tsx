import type { FileCategory, FileNode } from "@giselle-sdk/data-type";
import { useFeatureFlag, useWorkflowDesigner } from "giselle-sdk/react";
import { FileNodeIcon } from "../../../../icons/node";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../../../properties-panel/ui";
import { FilePanel } from "./file-panel";
import type { FileTypeConfig } from "./file-panel-type";

const fileType: Record<FileCategory, FileTypeConfig> = {
	pdf: {
		accept: ["application/pdf"],
		label: "PDF",
	},
	text: {
		accept: ["text/plain", "text/markdown"],
		label: "Text",
	},
	image: {
		accept: ["image/png", "image/jpeg", "image/gif", "image/svg"],
		label: "Image",
		maxSize: 1024 * 1024,
	},
};

export function FileNodePropertiesPanel({ node }: { node: FileNode }) {
	const { updateNodeData } = useWorkflowDesigner();
	const { layoutV2, sidemenu } = useFeatureFlag();

	const getFilePanelContent = () => {
		if (layoutV2) {
			return (
				<div className={sidemenu ? "p-4" : "pl-0 pr-4 py-4"}>
					<FilePanel node={node} config={fileType[node.content.category]} />
				</div>
			);
		}
		return <FilePanel node={node} config={fileType[node.content.category]} />;
	};

	return (
		<PropertiesPanelRoot>
			<PropertiesPanelHeader
				icon={
					<FileNodeIcon node={node} className="size-[20px] text-black-900" />
				}
				node={node}
				onChangeName={(name) => {
					updateNodeData(node, { name });
				}}
			/>
			<PropertiesPanelContent>{getFilePanelContent()}</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
