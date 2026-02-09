import { App } from "@giselles-ai/protocol";
import * as z from "zod/v4";
import { appPath } from "../path";
import { createGiselleFunction } from "../utils/create-giselle-function";
import { computeAppConnectionChangeEvent } from "./compute-app-connection-change-event";

export const saveApp = createGiselleFunction({
	input: z.object({ app: App }),
	handler: async ({ context, input }) => {
		const exist = await context.storage.exists(appPath(input.app.id));

		const previousApp = exist
			? await context.storage.getJson({
					path: appPath(input.app.id),
					schema: App,
				})
			: undefined;

		await context.storage.setJson({
			path: appPath(input.app.id),
			schema: App,
			data: input.app,
		});
		if (!exist) {
			await context.callbacks?.appCreate?.({ app: input.app });
		}

		const appConnectionChangeEvent = computeAppConnectionChangeEvent({
			exist,
			previousApp,
			nextApp: input.app,
		});
		if (appConnectionChangeEvent) {
			await context.callbacks?.appConnectionChange?.(appConnectionChangeEvent);
		}
	},
});
