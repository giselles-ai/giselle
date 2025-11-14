import { App, AppId } from "@giselles-ai/protocol";
import { z } from "zod/v4";
import { appPath } from "../path";
import { createGiselleFunction } from "../utils/create-giselle-function";

export const getApp = createGiselleFunction({
	input: z.object({ appId: AppId.schema }),
	handler: async ({ context, input }) => {
		return await context.storage.getJson({
			path: appPath(input.appId),
			schema: App,
		});
	},
});
