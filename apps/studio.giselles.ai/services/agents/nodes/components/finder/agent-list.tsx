import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandLoading,
} from "@/components/ui/command";
import { type FC, useCallback, useEffect, useState } from "react";
import { nodeService } from "../..";
import type { Agent } from "../../../types";
import { getAvailableAgents } from "../../actions/get-available-agents";
import { buildDefaultPort } from "../../builder";
import { type NodeGraph, portType } from "../../types";

type AgentListProps = {
	onSelect: (node: NodeGraph) => void;
};
export const AgentList: FC<AgentListProps> = ({ onSelect }) => {
	const [loading, setLoading] = useState(true);
	const [availableAgents, setAvaialbleAgents] = useState<Agent[]>([]);
	const fetchAgents = useCallback(async () => {
		setAvaialbleAgents(await getAvailableAgents());
		setLoading(false);
	}, []);
	useEffect(() => {
		fetchAgents();
	}, [fetchAgents]);

	if (loading) {
		return (
			<Command>
				<CommandLoading>Loading...</CommandLoading>
			</Command>
		);
	}
	return (
		<Command>
			<CommandInput
				placeholder="Filter agent..."
				autoFocus={true}
				className="h-9"
			/>
			<CommandList>
				<CommandEmpty>No agent found.</CommandEmpty>
				<CommandGroup>
					{availableAgents.map((availableAgent) => (
						<CommandItem
							key={availableAgent.id}
							onSelect={() => {
								const node = nodeService.createNode("agent", {
									data: {
										relevantAgent: {
											id: availableAgent.id,
											name: availableAgent.name ?? "",
											buildId: availableAgent.buildId,
											args: availableAgent.args,
										},
									},
									inputPorts: availableAgent.args.map((port) =>
										buildDefaultPort({
											type: portType.data,
											name: port.name,
										}),
									),
								});
								onSelect(node);
							}}
						>
							{availableAgent.name}
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</Command>
	);
};
