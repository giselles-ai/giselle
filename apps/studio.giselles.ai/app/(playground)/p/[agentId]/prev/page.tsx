import { getTeamMembershipByAgentId } from "@/app/(auth)/lib/get-team-membership-by-agent-id";
import { agents, db } from "@/drizzle";
import { debugFlag as getDebugFlag } from "@/flags";
import { getUser } from "@/lib/supabase";
import { getGitHubIdentityState } from "@/services/accounts";
import type { GitHubUserClient } from "@/services/external/github";
import "@xyflow/react/dist/style.css";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Playground } from "./beta-proto/component";
import type { Repository } from "./beta-proto/github-integration/context";
import type { Graph } from "./beta-proto/graph/types";
import {
	type ReactFlowEdge,
	type ReactFlowNode,
	giselleEdgeType,
	giselleNodeType,
} from "./beta-proto/react-flow-adapter/types";
import type { AgentId } from "./beta-proto/types";

// The maximum duration of server actions on this page is extended to 800 seconds through enabled fluid compute.
// https://vercel.com/docs/functions/runtimes#max-duration
export const maxDuration = 800;

function graphToReactFlow(grpah: Graph) {
	const nodes: ReactFlowNode[] = grpah.nodes.map((node) => {
		return {
			id: node.id,
			type: giselleNodeType,
			position: node.ui.position,
			selected: node.ui.selected,
			data: {
				...node,
			},
		};
	});

	const edges: ReactFlowEdge[] = grpah.connectors.map((connector) => {
		return {
			id: connector.id,
			type: giselleEdgeType,
			source: connector.source,
			target: connector.target,
			targetHandle: connector.targetHandle,
			data: connector,
		};
	});

	return {
		nodes,
		edges,
	};
}

async function getAgent(agentId: AgentId) {
	const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
	const xyFlow = graphToReactFlow(agent.graphv2);
	return {
		...agent,
		graphv2: {
			...agent.graphv2,
			xyFlow,
			flowIndexes: [],
		},
	};
}

async function fetchGitHubRepositories(): Promise<{
	needsAuthorization: boolean;
	repositories: Repository[];
}> {
	const identityState = await getGitHubIdentityState();
	if (
		identityState.status === "unauthorized" ||
		identityState.status === "invalid-credential"
	) {
		return { needsAuthorization: true, repositories: [] };
	}

	const repositories: Awaited<
		ReturnType<GitHubUserClient["getRepositories"]>
	>["repositories"] = [];
	const gitHubClient = identityState.gitHubUserClient;
	const { installations } = await gitHubClient.getInstallations();
	const allRepositories = await Promise.all(
		installations.map(async (installation) => {
			const { repositories: repos } = await gitHubClient.getRepositories(
				installation.id,
			);
			return repos;
		}),
	);
	repositories.push(...allRepositories.flat());
	repositories.sort((a, b) => a.name.localeCompare(b.name));
	return { needsAuthorization: false, repositories };
}

async function getGitHubIntegrationSetting(agentDbId: number) {
	return await db.query.gitHubIntegrations.findFirst({
		where: (gitHubIntegrations, { eq }) =>
			eq(gitHubIntegrations.agentDbId, agentDbId),
	});
}

export default async function AgentPlaygroundPage({
	params,
}: {
	params: Promise<{ agentId: AgentId }>;
}) {
	const { agentId } = await params;
	const user = await getUser();

	const teamMembership = await getTeamMembershipByAgentId(agentId, user.id);

	if (!teamMembership) {
		notFound();
	}

	const debugFlag = await getDebugFlag();
	const agent = await getAgent(agentId);
	const gitHubIntegrationSetting = await getGitHubIntegrationSetting(
		agent.dbId,
	);
	const { repositories, needsAuthorization } = await fetchGitHubRepositories();

	return (
		<Playground
			agentId={agentId}
			agentName={agent.name || "Untitled Agent"}
			graph={agent.graphv2}
			featureFlags={{
				debugFlag,
				viewFlag: true,
				playgroundV2Flag: false,
			}}
			gitHubIntegration={{
				repositories,
				needsAuthorization,
				setting: gitHubIntegrationSetting,
			}}
		/>
	);
}
