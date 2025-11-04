import { Button } from "@giselle-internal/ui/button";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@giselle-internal/ui/dialog";
import { type AgentActivity, AgentUsageTable } from "./agent-usage-table";

type AgentUsageDialogProps = {
	activities: AgentActivity[];
};

export function AgentUsageDialog({ activities }: AgentUsageDialogProps) {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="primary" size="large">
					View All Logs
				</Button>
			</DialogTrigger>
			<DialogContent size="wide">
				<div className="py-[12px]">
					<DialogTitle className="text-white-400 text-[16px] leading-[27.2px] tracking-normal font-sans">
						App Usage Logs
					</DialogTitle>
				</div>
				<AgentUsageTable
					activities={activities}
					containerClassName="max-h-[60vh] overflow-y-auto"
				/>
			</DialogContent>
		</Dialog>
	);
}
