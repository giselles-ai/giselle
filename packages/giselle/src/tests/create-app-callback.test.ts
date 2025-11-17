import { type App, AppId, NodeId, WorkspaceId } from "@giselles-ai/protocol";
import { memoryStorageDriver } from "@giselles-ai/storage";
import { noopVaultDriver } from "@giselles-ai/vault";
import { expect, test, vi } from "vitest";
import { Giselle } from "../giselle";

test("callback.appCreate is executed when app is created if app does not exist in storage yet", async () => {
	const appCreateMock = vi.fn();
	const testGiselle = Giselle({
		storage: memoryStorageDriver(),
		vault: noopVaultDriver,
		callbacks: {
			appCreate: appCreateMock,
		},
	});
	const testApp: App = {
		id: AppId.generate(),
		name: "test app",
		description: "test app description",
		iconName: "cable",
		parameters: [],
		entryNodeId: NodeId.generate(),
		workspaceId: WorkspaceId.generate(),
	};
	await testGiselle.saveApp({ app: testApp });
	expect(appCreateMock).toHaveBeenCalled();

	// Reset the mock to check that it's not called again
	appCreateMock.mockClear();

	// When saveApp is executed again, it should not be called since
	await testGiselle.saveApp({ app: testApp });
	expect(appCreateMock).not.toHaveBeenCalled();
});
