import { Card } from "@/components/ui/card";
import { getAgentActivities } from "./actions";
import { AgentUsageDialog } from "./agent-usage-dialog";
import { AgentUsageTable } from "./agent-usage-table";

export async function AgentUsage() {
	const result = await getAgentActivities({ limit: 50 });

	if (!result.success || !result.data) {
		return (
			<Card title="Recent App Usage">
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
			title="Recent App Usage"
			action={{
				component:
					activities.length > 0 ? (
						<AgentUsageDialog activities={activities} />
					) : null,
			}}
			description="This shows the usage data from running your Apps in Giselle."
		>
			<AgentUsageTable activities={recentActivities} />
		</Card>
	);
}
