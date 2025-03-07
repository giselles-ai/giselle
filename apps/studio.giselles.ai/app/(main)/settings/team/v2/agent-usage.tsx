import { Card } from "@/app/(main)/settings/components/v2/card";
import { getAgentActivities } from "../actions";
import { AgentUsageDialog } from "../v2/agent-usage-dialog";
import { AgentUsageTable } from "../v2/agent-usage-table";

export async function AgentUsage() {
	const result = await getAgentActivities({ limit: 50 });

	if (!result.success || !result.data) {
		return (
			<Card title="Recent Agent">
				<div className="text-black-400 text-[12px] leading-[20.4px] tracking-normal font-geist">
					Failed to load agent activities
				</div>
			</Card>
		);
	}

	const activities = result.data;
	const recentActivities = activities.slice(0, 3);

	return (
		<Card
			title="Recent Agent"
			description="This is your URL namespace within Giselle. Please use 48 characters at maximum."
			action={{
				component:
					activities.length > 0 ? (
						<AgentUsageDialog activities={activities} />
					) : null,
			}}
		>
			<AgentUsageTable activities={recentActivities} />
		</Card>
	);
}
