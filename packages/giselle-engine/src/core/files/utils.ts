import type { FileId, GenerationOrigin } from "@giselle-sdk/data-type";

export function filePath(
	params: { fileId: FileId; fileName: string } & GenerationOrigin,
) {
	switch (params.type) {
		case "workspace":
			return `workspaces/${params.id}/files/${params.fileId}/${params.fileName}`;

		case "run":
			return `runs/${params.id}/files/${params.fileId}/${params.fileName}`;
		default: {
			const _exhaustiveCheck: never = params;
			return _exhaustiveCheck;
		}
	}
}
