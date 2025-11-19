import { createPrivateKey } from "node:crypto";
import { logger, schemaTask as schemaJob } from "@trigger.dev/sdk";

export const investigatePrivateKeyJob = schemaJob({
	id: "debug.privateKey.investigation",
	async run() {
		const key = process.env.PRIVATE_KEY ?? "";

		// --- Step 1: summarize key (safe) --- //
		const header = key.match(/-----BEGIN ([^-]+)-----/)?.[1] ?? "UNKNOWN";
		const isEncrypted = key.includes("ENCRYPTED");
		const hasBegin = key.includes("-----BEGIN");
		const hasEnd = key.includes("-----END");
		const length = key.length;

		logger.info("Private key summary", {
			header,
			isEncrypted,
			hasBegin,
			hasEnd,
			length,
			previewStart: key.slice(0, 30).replace(/.{8}$/, "********"),
			previewEnd: key.slice(-30).replace(/^.{8}/, "********"),
		});

		// --- Step 2: detect format --- //
		let format: string = "UNKNOWN";
		if (header.includes("OPENSSH")) format = "OPENSSH";
		if (header.includes("RSA PRIVATE KEY")) format = "PKCS1_RSA";
		if (header === "PRIVATE KEY") format = "PKCS8";
		if (header.includes("ENCRYPTED PRIVATE KEY")) format = "PKCS8_ENCRYPTED";

		logger.info("Format detected", { format });

		// --- Step 3: try createPrivateKey --- //
		try {
			const keyObj = createPrivateKey({ key });
			logger.info("createPrivateKey: OK", {
				type: keyObj.type,
				asymmetricKeyType: keyObj.asymmetricKeyType,
				exportable: true,
			});
		} catch (err) {
			logger.error("createPrivateKey: FAILED", {
				name: err instanceof Error ? err.name : err,
				message: err instanceof Error ? err.message : err,
				// biome-ignore lint/suspicious/noExplicitAny: debug
				cause: (err as any).cause,
			});
		}
		// for typesafe
		await Promise.resolve();
	},
});
