import {
	AppId,
	type ConnectedApp,
	type DisconnectedApp,
	NodeId,
	WorkspaceId,
} from "@giselles-ai/protocol";
import { describe, expect, test } from "vitest";
import { computeAppConnectionChangeEvent } from "./compute-app-connection-change-event";

function createDisconnectedApp(
	overrides?: Partial<DisconnectedApp>,
): DisconnectedApp {
	return {
		id: AppId.generate(),
		version: "v1",
		state: "disconnected",
		description: "",
		parameters: [],
		entryNodeId: NodeId.generate(),
		workspaceId: WorkspaceId.generate(),
		...overrides,
	};
}

function createConnectedApp(overrides?: Partial<ConnectedApp>): ConnectedApp {
	return {
		id: AppId.generate(),
		version: "v1",
		state: "connected",
		description: "",
		parameters: [],
		entryNodeId: NodeId.generate(),
		endNodeId: NodeId.generate(),
		workspaceId: WorkspaceId.generate(),
		...overrides,
	};
}

describe("computeAppConnectionChangeEvent", () => {
	test("returns connected when the app is saved as connected for the first time", () => {
		const nextApp = createConnectedApp();

		const event = computeAppConnectionChangeEvent({
			exist: false,
			previousApp: undefined,
			nextApp,
		});

		expect(event).toEqual({
			event: "connected",
			payload: { app: nextApp },
		});
	});

	test("returns connected when transitioning from disconnected to connected", () => {
		const previousApp = createDisconnectedApp();
		const nextApp = createConnectedApp({
			id: previousApp.id,
			entryNodeId: previousApp.entryNodeId,
			workspaceId: previousApp.workspaceId,
		});

		const event = computeAppConnectionChangeEvent({
			exist: true,
			previousApp,
			nextApp,
		});

		expect(event?.event).toBe("connected");
	});

	test("returns null when connected->connected but connectivity details did not change", () => {
		const endNodeId = NodeId.generate();
		const entryNodeId = NodeId.generate();
		const workspaceId = WorkspaceId.generate();

		const previousApp = createConnectedApp({
			endNodeId,
			entryNodeId,
			workspaceId,
		});
		const nextApp = createConnectedApp({
			id: previousApp.id,
			endNodeId,
			entryNodeId,
			workspaceId,
		});

		const event = computeAppConnectionChangeEvent({
			exist: true,
			previousApp,
			nextApp,
		});

		expect(event).toBeNull();
	});

	test("returns connected when connected->connected and endNodeId changed", () => {
		const entryNodeId = NodeId.generate();
		const workspaceId = WorkspaceId.generate();

		const previousApp = createConnectedApp({
			endNodeId: NodeId.generate(),
			entryNodeId,
			workspaceId,
		});
		const nextApp = createConnectedApp({
			id: previousApp.id,
			entryNodeId,
			workspaceId,
			endNodeId: NodeId.generate(),
		});

		const event = computeAppConnectionChangeEvent({
			exist: true,
			previousApp,
			nextApp,
		});

		expect(event?.event).toBe("connected");
	});

	test("returns disconnected when transitioning from connected to disconnected", () => {
		const previousApp = createConnectedApp();
		const nextApp = createDisconnectedApp({
			id: previousApp.id,
			entryNodeId: previousApp.entryNodeId,
			workspaceId: previousApp.workspaceId,
		});

		const event = computeAppConnectionChangeEvent({
			exist: true,
			previousApp,
			nextApp,
		});

		expect(event).toEqual({
			event: "disconnected",
			payload: { app: nextApp },
		});
	});

	test("returns null when disconnected->disconnected", () => {
		const previousApp = createDisconnectedApp();
		const nextApp = createDisconnectedApp({
			id: previousApp.id,
			entryNodeId: previousApp.entryNodeId,
			workspaceId: previousApp.workspaceId,
		});

		const event = computeAppConnectionChangeEvent({
			exist: true,
			previousApp,
			nextApp,
		});

		expect(event).toBeNull();
	});
});
