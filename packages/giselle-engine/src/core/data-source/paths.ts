import type { WorkspaceId } from "@giselle-sdk/data-type";
import type { DataSourceId } from "./types/object";

export function dataSourcePath(dataSourceId: DataSourceId) {
	return `data-sources/${dataSourceId}/data-source.json`;
}

export function workspaceDataSourceIndexPath(workspaceId: WorkspaceId) {
	return `data-sources/byWorkspace/${workspaceId}.json`;
}
