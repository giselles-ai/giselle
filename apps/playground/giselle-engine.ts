import { NextGiselleEngine } from "giselle-sdk/next";

import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import vercelBlobDriver from "unstorage/drivers/vercel-blob";

const isVercelEnvironment = process.env.VERCEL === "1";

const storage = createStorage({
	driver: isVercelEnvironment
		? vercelBlobDriver({
				access: "public",
				base: "private-beta",
			})
		: fsDriver({
				base: "./.storage",
			}),
});

export const giselleEngine = NextGiselleEngine({
	basePath: "/api/giselle",
	storage,
	llmProviders: ["openai", "anthropic", "google"],
});
