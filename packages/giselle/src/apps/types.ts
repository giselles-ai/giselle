import type {
	App,
	AppId,
	ConnectedApp,
	DisconnectedApp,
} from "@giselles-ai/protocol";

export type OnAppCreate = (args: { app: App }) => void | Promise<void>;

export type OnAppDelete = (args: { appId: AppId }) => void | Promise<void>;

export type AppConnectionChangeEvent =
	| {
			event: "connected";
			payload: {
				app: ConnectedApp;
			};
	  }
	| {
			event: "disconnected";
			payload: {
				app: DisconnectedApp;
			};
	  };

export type OnAppConnectionChange = (
	args: AppConnectionChangeEvent,
) => void | Promise<void>;
