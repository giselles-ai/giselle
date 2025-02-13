import { Background, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import { Suspense } from "react";
import { getAgent } from "../actions/get-agent";
import { getKnowledges } from "../knowledges";
import type { RequestRunnerProvider } from "../requests/types";
import type { AgentId } from "../types";
import { getGraph } from "./actions/get-graph";
import { PlaygroundProvider } from "./context";
import { Inner } from "./inner";
import { SideNav } from "./side-nav/components";
import type { PlaygroundOption } from "./types";

const Skeleton = () => {
	return (
		<div className="h-full w-full">
			<ReactFlow key={"loader"}>
				<Background />
			</ReactFlow>
		</div>
	);
};

type PlaygroundProps = {
	agentId: AgentId;
	requestRunnerProvider: RequestRunnerProvider;
	options?: PlaygroundOption[];
};
export async function Playground({
	agentId,
	requestRunnerProvider,
	options,
}: PlaygroundProps) {
	const [agent, graph, knowledges] = await Promise.all([
		getAgent({ agentId }),
		getGraph({ agentId }),
		getKnowledges({ agentId }),
	]);
	return (
		<Suspense fallback={<Skeleton />}>
			<PlaygroundProvider
				agentId={agentId}
				name={agent.name}
				requestRunnerProvider={requestRunnerProvider}
				graph={graph}
				knowledges={knowledges}
				options={options ?? []}
			>
				<ReactFlowProvider>
					<div className="h-full w-full flex flex-col">
						<div className="flex flex-1">
							<SideNav />
							<Inner />
						</div>
					</div>
				</ReactFlowProvider>
			</PlaygroundProvider>
		</Suspense>
	);
}
