import type { App, AppId } from "@giselles-ai/protocol";

export type OnAppCreate = (args: { app: App }) => void | Promise<void>;

export type OnAppDelete = (args: { appId: AppId }) => void | Promise<void>;
