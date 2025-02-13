// import { useBlueprint } from "@/app/agents/blueprints";
// import { useRequest } from "@/app/agents/requests";
// import type { FC } from "react";
// import { RequestButton } from "./request-button";
// import { RequestLogger } from "./request-logger";
// import { RequiredAction } from "./required-action";

import type { FC } from "react";
import { RequestButton, RequestLogger } from "../../../requests/components";
import { usePlayground } from "../../context";

// export const RequestPanel: FC = () => {
// 	const { blueprint } = useBlueprint();
// 	const request = useRequest();
// 	return (
// 		<div className="px-4 py-2">
// 			{request != null && (
// 				<div className="mb-4 pb-4 border-b border-border">
// 					<RequestLogger request={request} />
// 				</div>
// 			)}
// 			{blueprint.requiredActions && (
// 				<RequiredAction requiredActions={blueprint.requiredActions} />
// 			)}
// 			{request != null && <p>New request</p>}
// 			{(blueprint.requiredActions == null ||
// 				blueprint.requiredActions.length === 0) && <RequestButton />}
// 		</div>
// 	);
// };

export const RequestPanel: FC = () => {
	const { state } = usePlayground();
	return (
		<div className="px-4 py-2">
			<RequestButton playgroundGraph={state.graph} />
			<RequestLogger />
		</div>
	);
};
