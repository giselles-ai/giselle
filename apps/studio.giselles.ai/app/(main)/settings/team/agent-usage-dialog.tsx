import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../components/button";
import { type AgentActivity, AgentUsageTable } from "./agent-usage-table";

type AgentUsageDialogProps = {
	activities: AgentActivity[];
};

export function AgentUsageDialog({ activities }: AgentUsageDialogProps) {
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="primary">View All Logs</Button>
			</DialogTrigger>
			<DialogContent className="border-[0.5px] border-black-400 px-[24px] pt-[16px] pb-[24px] bg-black-850 max-w-7xl">
				<DialogHeader>
					<DialogTitle className="text-white-400 text-[16px] leading-[27.2px] tracking-normal font-sans">
						App Usage Logs
					</DialogTitle>
				</DialogHeader>
				<AgentUsageTable
					activities={activities}
					containerClassName="max-h-[60vh] overflow-y-auto"
				/>
			</DialogContent>
		</Dialog>
	);
}
