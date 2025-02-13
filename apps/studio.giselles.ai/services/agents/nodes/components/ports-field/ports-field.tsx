import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { createId } from "@paralleldrive/cuid2";
import { PlusIcon } from "lucide-react";
import { type FC, type FormEventHandler, useCallback, useState } from "react";
import { useAddPort } from "../../contexts/add-port";
import type { NodeGraph, PortDirection } from "../../types";
import { PortListItem } from "./port-list-item";

type PortsField = {
	node: NodeGraph;
	heading?: string;
	direction: PortDirection;
};
export const PortsField: FC<PortsField> = ({
	node,
	heading = "Port Field",
	direction,
}) => {
	const { addPort } = useAddPort();
	const [disclosure, setDisclosure] = useState(false);
	const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
		(formEvent) => {
			formEvent.preventDefault();
			setDisclosure(false);
			const formData = new FormData(formEvent.currentTarget);
			addPort({
				nodeId: node.id,
				id: `pt_${createId()}` as const,
				type: "data",
				name: formData.get("name") as string,
				direction,
			});
		},
		[node.id, addPort, direction],
	);
	return (
		<div>
			<div className="flex justify-between mb-2">
				<h3 className="text-sm font-bold">{heading}</h3>
				<div>
					<Popover open={disclosure} onOpenChange={setDisclosure}>
						<PopoverTrigger asChild>
							<Button>
								<PlusIcon className="w-4 h-4" />
							</Button>
						</PopoverTrigger>
						<PopoverContent align="end">
							<form onSubmit={handleSubmit}>
								<div className="flex flex-col gap-4">
									<Input placeholder="Parameter" name="name" data-1p-ignore />
									<div className="flex justify-end">
										<Button type="submit">Create parameter</Button>
									</div>
								</div>
							</form>
						</PopoverContent>
					</Popover>
				</div>
			</div>
			<div className="flex flex-col gap-1">
				{node.ports
					.filter(
						(port) => port.type === "data" && port.direction === direction,
					)
					.map((port) => (
						<PortListItem key={port.id} port={port} />
					))}
			</div>
		</div>
	);
};
