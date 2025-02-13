"use client";

import { type FC, type PropsWithChildren, useReducer } from "react";
import type { AgentId } from "../types";
import { RequestContext } from "./context";
import { requestReducer } from "./reducer";
import { RequestRunner } from "./runners";
// import type { RequestRunnerComponent, RequestRunnerProvider } from "./types";

type RequestProviderProps = {
	agentId: AgentId;
	onBeforeRequestStartAction: () => Promise<void>;
	// requestRunner: RequestRunnerComponent;
};
export const RequestProvider: FC<PropsWithChildren<RequestProviderProps>> = ({
	children,
	onBeforeRequestStartAction,
	agentId,
}) => {
	const [state, dispatch] = useReducer(requestReducer, {
		agentId,
		request: null,
	});
	// const requestStartAction = useCallback(async () => {
	// 	const build = await buildPlaygroundGraph(agentId);
	// 	const newRequest = await createRequest(build.id);
	// 	setRequestId(newRequest.id);
	// 	switch (requestRunnerProvider) {
	// 		case "vercelFunctions":
	// 			fetch(`/agents/requests/${newRequest.id}`, {
	// 				method: "POST",
	// 			});
	// 			return;
	// 		case "triggerDev":
	// 			runOnTriggerDev({ requestId: newRequest.id });
	// 			return;
	// 	}
	// }, [agentId, requestRunnerProvider]);

	// useEffect(() => {
	// 	if (requestId == null) {
	// 		return;
	// 	}

	// 	let timeoutId: NodeJS.Timeout;

	// 	async function pollingGetRequest(requestId: RequestId) {
	// 		const request = await getRequest(requestId);
	// 		setRequest(request);
	// 		if (request != null && request.status === requestStatus.completed) {
	// 			return; // ポーリング終了
	// 		}
	// 		// 次のポーリングをスケジュール
	// 		timeoutId = setTimeout(() => pollingGetRequest(requestId), 2000);
	// 	}

	// 	pollingGetRequest(requestId);

	// 	return () => {
	// 		clearTimeout(timeoutId);
	// 	};
	// }, [requestId]);
	return (
		<RequestContext.Provider
			value={{
				state,
				dispatch,
				onBeforeRequestStartAction,
			}}
		>
			{state.request != null && <RequestRunner requestId={state.request.id} />}
			{children}
		</RequestContext.Provider>
	);
};
