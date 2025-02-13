import type { StorageClient } from "./types";

export function createLocalStorageClient(): StorageClient {
	if (typeof window === "undefined") {
		throw new Error("localStorage requires browser runtime");
	}
	return {
		put: (keyName: string, keyValue: string) => {
			localStorage.setItem(keyName, keyValue);
		},
		get: (keyName: string) => {
			return localStorage.getItem(keyName);
		},
	};
}
