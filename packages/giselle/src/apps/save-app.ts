import { App } from "@giselles-ai/protocol";
import * as z from "zod/v4";
import { appPath } from "../path";
import { createGiselleFunction } from "../utils/create-giselle-function";

export const saveApp = createGiselleFunction({
	input: z.object({ app: App }),
	handler: async ({ context, input }) => {
		const exist = await context.storage.exists(appPath(input.app.id));
		await context.storage.setJson({
			path: appPath(input.app.id),
			schema: App,
			data: input.app,
		});
		if (!exist) {
			await context.callbacks?.appCreate?.({ app: input.app });
		}
	},
});
