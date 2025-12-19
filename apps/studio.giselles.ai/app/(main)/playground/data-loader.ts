import { loadStageAppsData } from "../lib/stage-apps";

export async function dataLoader() {
	return await loadStageAppsData();
}

export type LoaderData = Awaited<ReturnType<typeof dataLoader>>;
