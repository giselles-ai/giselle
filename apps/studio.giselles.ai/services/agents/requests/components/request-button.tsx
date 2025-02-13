"use client";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { type FC, useActionState, useMemo } from "react";
import { portDirection, portType } from "../../nodes/types";
import type { PlaygroundGraph } from "../../playground/types";
import { buildPlaygroundGraph, createRequest, startRequest } from "../actions";
import { useRequest } from "../context";
import { getTriggerNode } from "../helpers";
import { requestStatus } from "../types";
import type { BuildAndRequestActionError } from "./build-and-request-action";

type RequestTriggerProps = {
	playgroundGraph: PlaygroundGraph;
};
export const RequestButton: FC<RequestTriggerProps> = ({ playgroundGraph }) => {
	const { state, dispatch, onBeforeRequestStartAction } = useRequest();
	const requestParameters = useMemo(() => {
		const triggerNode = getTriggerNode(playgroundGraph);
		if (triggerNode == null) {
			return null;
		}
		return triggerNode.ports.filter(
			({ direction, type }) =>
				direction === portDirection.source && type === portType.data,
		);
	}, [playgroundGraph]);
	const [_, action, isPending] = useActionState(
		async (
			_prevState: BuildAndRequestActionError | null,
			formData: FormData,
		) => {
			const inputRequestParameters = requestParameters
				?.map(({ id }) => {
					const value = formData.get(id);
					if (value == null || typeof value !== "string") {
						return null;
					}
					return { portId: id, value };
				})
				.filter((i) => i !== null);
			await onBeforeRequestStartAction();
			const build = await buildPlaygroundGraph(state.agentId);
			const request = await createRequest({
				buildId: build.id,
				parameters: inputRequestParameters ?? [],
			});
			dispatch({
				type: "SET_REQUEST",
				request: {
					id: request.id,
					stacks: [],
					status: requestStatus.queued,
					result: null,
				},
			});
			await startRequest(request.id);
			return null;
		},
		null,
	);
	if (requestParameters == null || requestParameters.length === 0) {
		return (
			<form action={action}>
				<Button type="submit" disabled={isPending}>
					Request
				</Button>
			</form>
		);
	}
	return (
		<form action={action} className="grid gap-[16px]">
			{requestParameters.map(({ id, name }) => (
				<Field key={id} name={id} label={name} type="text" required />
			))}
			<Button type="submit" disabled={isPending}>
				Request
			</Button>
		</form>
	);
};
