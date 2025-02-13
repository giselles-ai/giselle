"use client";

import { type FC, useEffect, useRef } from "react";
import { createRequestStack, getRequest, runStep } from "../actions";
import { useRequest } from "../context";
import type { RequestId, RequestStackId, RequestStep } from "../types";

type RequestRunnerProps = {
	requestId: RequestId;
};
export const RequestRunner: FC<RequestRunnerProps> = ({ requestId }) => {
	const { dispatch, state } = useRequest();
	useEffect(() => {
		createRequestStack({ requestId })
			.then(() => getRequest(requestId))
			.then((request) => {
				dispatch({
					type: "SET_REQUEST",
					request,
				});
			});
	}, [requestId, dispatch]);
	return (
		<>
			{state.request?.stacks.flatMap((stack) =>
				stack.steps.map((step) => (
					<RequestStepRunner
						key={step.id}
						requestId={requestId}
						stackId={stack.id}
						step={step}
					/>
				)),
			)}
		</>
	);
};

type RequestStepProps = {
	requestId: RequestId;
	stackId: RequestStackId;
	step: RequestStep;
};
const RequestStepRunner: FC<RequestStepProps> = ({
	step,
	requestId,
	stackId,
}) => {
	const { dispatch } = useRequest();
	useEffectOnce(() => {
		runStep(requestId, stackId, step.id)
			.then(() => getRequest(requestId))
			.then((request) => {
				dispatch({
					type: "SET_REQUEST",
					request,
				});
			});
	});
	return null;
};

// biome-ignore lint/suspicious/noExplicitAny:
function useEffectOnce(effect: any) {
	const destroyFunc = useRef(() => {});
	const effectCalled = useRef(false);
	const renderAfterCalled = useRef(false);

	if (effectCalled.current) {
		renderAfterCalled.current = true;
	}

	useEffect(() => {
		// Only execute the effect first time around
		if (!effectCalled.current) {
			destroyFunc.current = effect();
			effectCalled.current = true;
		}

		// This is the cleanup function
		return () => {
			// if the comp didn't render since the useEffect was called,
			// we know it's the dummy React cycle
			if (!renderAfterCalled.current) {
				return;
			}
			if (destroyFunc.current) {
				destroyFunc.current();
			}
		};
	}, [effect]);
}
