import { createLoader, parseAsString } from "nuqs/server";

const stageTopSearchParams = {
	appId: parseAsString.withDefault(""),
};

export const loadSearchParams = createLoader(stageTopSearchParams);
