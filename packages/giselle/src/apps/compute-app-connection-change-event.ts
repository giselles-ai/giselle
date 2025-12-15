import type { App } from "@giselles-ai/protocol";
import type { AppConnectionChangeEvent } from "./types";

export function computeAppConnectionChangeEvent(args: {
	exist: boolean;
	previousApp?: App;
	nextApp: App;
}): AppConnectionChangeEvent | null {
	const { exist, previousApp, nextApp } = args;

	if (nextApp.state === "connected") {
		const previousConnectedApp =
			previousApp?.state === "connected" ? previousApp : undefined;
		const hasConnectionChanged =
			previousApp?.state !== "connected" ||
			previousConnectedApp?.endNodeId !== nextApp.endNodeId ||
			previousApp?.entryNodeId !== nextApp.entryNodeId ||
			previousApp?.workspaceId !== nextApp.workspaceId;

		if (!exist || hasConnectionChanged) {
			return {
				event: "connected",
				payload: {
					app: nextApp,
				},
			};
		}
		return null;
	}

	if (previousApp?.state === "connected") {
		return {
			event: "disconnected",
			payload: {
				app: nextApp,
			},
		};
	}

	return null;
}
