import type { WorkspaceId } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { addWorkspaceIndexItem } from "../utils/workspace-index";
import { createVectorStore } from "../vector-store/create-vector-store";
import { dataSourcePath, workspaceDataSourceIndexPath } from "./paths";
import {
	DataSourceId,
	DataSourceIndexObject,
	type DataSourceObject,
	type DataSourceProviderObject,
} from "./types/object";

export async function createDataSource(args: {
	context: GiselleEngineContext;
	workspaceId: WorkspaceId;
	dataSource: DataSourceProviderObject;
}) {
	const vectorStore = await createVectorStore(args);
	let dataSource: DataSourceObject | undefined;
	switch (args.dataSource.provider) {
		case "github":
			dataSource = {
				id: DataSourceId.generate(),
				status: "inProgress",
				vectorStoreId: vectorStore.id,
				provider: args.dataSource.provider,
				providerMetadata: args.dataSource.providerMetadata,
				workspaceId: args.workspaceId,
			};
	}
	if (dataSource === undefined) {
		throw new Error(
			`Unknown data source provider: ${args.dataSource.provider}`,
		);
	}
	await Promise.all([
		args.context.storage.setItem(dataSourcePath(dataSource.id), dataSource),
		addWorkspaceIndexItem({
			storage: args.context.storage,
			indexPath: workspaceDataSourceIndexPath(dataSource.workspaceId),
			item: dataSource,
			itemSchema: DataSourceIndexObject,
		}),
	]);
	return dataSource;
}
