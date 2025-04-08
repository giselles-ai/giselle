import { getInstallation } from "@giselle-sdk/github-client";
import type { GiselleEngineContext } from "../types";

export async function getInstallationRepositories(args: {
	context: GiselleEngineContext;
	installationIds: number[];
}) {
	return Promise.all(
		args.installationIds.map((installationId) => {
			const githubConfig = args.context.integrationConfigs?.find(
				(config) => config.provider === "github",
			);
			if (githubConfig === undefined) {
				return null;
			}
			if (!(githubConfig.auth.strategy === "github-installation")) {
				return null;
			}

			return getInstallation({
				...githubConfig.auth,
				installationId,
			});
		}),
	).then((res) => res.filter((i) => i !== null));
}
