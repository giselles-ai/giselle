import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
	requestId?: string;
}

export const requestContextStore = new AsyncLocalStorage<
	RequestContext | undefined
>();

export function getRequestContext() {
	return requestContextStore.getStore();
}
export function getRequestId() {
	const ctx = getRequestContext();
	return ctx?.requestId;
}
