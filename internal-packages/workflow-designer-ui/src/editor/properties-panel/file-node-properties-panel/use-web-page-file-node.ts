import type { FileData, FileNode } from "@giselle-sdk/data-type";
import { useState } from "react";

export function useWebPageFileNode(_node: FileNode) {
	const [urls, setUrls] = useState("");
	const [format, setFormat] = useState<"html" | "markdown">("markdown");
	const [isFetching, setIsFetching] = useState(false);
	const [fetchStatuses, setFetchStatuses] = useState<
		Record<string, "fetching" | "success" | "error">
	>({});
	const [files, setFiles] = useState<FileData[]>([]);
	const [urlError, setUrlError] = useState("");

	const onFetch = async () => {
		const urlList = urls
			.split("\n")
			.map((u) => u.trim())
			.filter(Boolean);
		if (urlList.length === 0) return;
		setIsFetching(true);
		setUrlError("");
		setFetchStatuses(
			Object.fromEntries(urlList.map((url) => [url, "fetching"])),
		);
		// Simulate async fetch for each URL
		await Promise.all(
			urlList.map(
				(url, i) =>
					new Promise<void>((resolve) => {
						setTimeout(
							() => {
								setFetchStatuses((prev) => ({ ...prev, [url]: "success" }));
								setFiles((prev) => [
									...prev,
									{
										id: `fl-${url.replace(/[^a-zA-Z0-9]/g, "")}-${Date.now()}`,
										name: url,
										type: format === "markdown" ? "text/markdown" : "text/html",
										size: 0,
										status: "uploaded",
										uploadedAt: Date.now(),
									},
								]);
								resolve();
							},
							800 + i * 400,
						); // staggered for effect
					}),
			),
		);
		setIsFetching(false);
	};

	const onRemoveFile = (file: FileData) => {
		setFiles((prev) => prev.filter((f) => f.id !== file.id));
	};

	return {
		urls,
		setUrls,
		format,
		setFormat,
		isFetching,
		fetchStatuses,
		files,
		onFetch,
		onRemoveFile,
		urlError,
	};
}
