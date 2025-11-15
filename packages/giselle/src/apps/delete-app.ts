import { AppId } from "@giselles-ai/protocol";
import * as z from "zod/v4";
import { appPath } from "../path";
import { createGiselleFunction } from "../utils/create-giselle-function";

export const deleteApp = createGiselleFunction({
	input: z.object({ appId: AppId.schema }),
	handler: async ({ context, input }) => {
		await context.storage.remove(appPath(input.appId));
		await context.callbacks?.appDelete?.({ appId: input.appId });
	},
});
