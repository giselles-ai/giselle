import {
	isWebPageNode,
	type WebPage,
	WebPageId,
	type WebPageNode,
} from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useAppDesignerStoreApi } from "../app-designer-provider";
import { useGiselle } from "../giselle-client-provider";
import { useAppDesignerStore } from "../hooks";
import { useUpdateNodeDataContent } from "./use-update-node-data-content";

function normalizeHttpsUrl(raw: string): string | null {
	try {
		const url = new URL(raw);
		if (url.protocol !== "https:") return null;
		return url.href;
	} catch {
		return null;
	}
}

export function useAddWebPages() {
	const client = useGiselle();
	const workspaceId = useAppDesignerStore((s) => s.workspaceId);
	const store = useAppDesignerStoreApi();
	const updateNodeDataContent = useUpdateNodeDataContent();

	return useCallback(
		async (args: {
			nodeId: WebPageNode["id"];
			urls: string[];
			onError?: (message: string) => void;
		}) => {
			const urls = args.urls.map((u) => u.trim()).filter((u) => u.length > 0);
			if (urls.length === 0) {
				args.onError?.("Please enter at least one valid URL.");
				return;
			}

			const normalizedUrls: string[] = [];
			for (const url of urls) {
				const normalized = normalizeHttpsUrl(url);
				if (normalized === null) {
					args.onError?.("Invalid URL format. Use https://");
					return;
				}
				normalizedUrls.push(normalized);
			}

			const node = store.getState().nodes.find((n) => n.id === args.nodeId) as
				| WebPageNode
				| undefined;
			if (!node || node.content.type !== "webPage") {
				return;
			}
			const existingUrls = new Set(
				node.content.webpages.map((w) => normalizeHttpsUrl(w.url) ?? w.url),
			);

			const batchSeen = new Set<string>();

			for (const url of normalizedUrls) {
				if (batchSeen.has(url) || existingUrls.has(url)) {
					args.onError?.(`duplicate URL: ${url}`);
					continue;
				}
				batchSeen.add(url);

				const node = store.getState().nodes.find((n) => n.id === args.nodeId) as
					| WebPageNode
					| undefined;
				if (!node || node.content.type !== "webPage") {
					return;
				}

				const newWebPage: WebPage = {
					id: WebPageId.generate(),
					status: "fetching",
					url,
				};

				updateNodeDataContent<WebPageNode>(node, {
					webpages: [...node.content.webpages, newWebPage],
				});

				try {
					const addedWebPage = await client.addWebPage({
						webpage: newWebPage,
						workspaceId,
					});
					const node = store.getState().nodes.find((n) => n.id === args.nodeId);
					if (!isWebPageNode(node)) {
						return;
					}
					updateNodeDataContent<WebPageNode>(node, {
						webpages: [
							...node.content.webpages.filter((w) => w.id !== addedWebPage.id),
							addedWebPage,
						],
					});
				} catch (error) {
					const errorMessage =
						error instanceof Error
							? error.message
							: error === null || error === undefined
								? "Failed to fetch webpage."
								: String(error);
					const failedWebPage: WebPage = {
						id: newWebPage.id,
						status: "failed",
						url: newWebPage.url,
						errorMessage,
					};
					const node = store.getState().nodes.find((n) => n.id === args.nodeId);
					if (!isWebPageNode(node)) {
						return;
					}
					updateNodeDataContent<WebPageNode>(node, {
						webpages: [
							...node.content.webpages.filter((w) => w.id !== failedWebPage.id),
							failedWebPage,
						],
					});
				}
			}
		},
		[client, store, updateNodeDataContent, workspaceId],
	);
}
