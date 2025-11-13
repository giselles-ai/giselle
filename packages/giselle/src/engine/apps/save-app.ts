import { App } from "@giselles-ai/protocol";
import { z } from "zod/v4";
import { appPath } from "../path";
import { createGiselleFunction } from "../utils/create-giselle-function";

export const saveApp = createGiselleFunction({
	input: z.object({ app: App }),
	handler: async ({ context, input }) => {
		await context.storage.setJson({
			path: appPath(input.app.id),
			schema: App,
			data: input.app,
		});
		await context.callbacks?.appCreate?.({ app: input.app });
	},
});
