"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useRef } from "react";
import { selectTeam } from "../actions/select-team";
import type { Team } from "../types";

type TeamSelectionFormProps = {
	allTeams: Team[];
	currentTeam: Team;
};

export function TeamSelectionForm({
	allTeams,
	currentTeam,
}: TeamSelectionFormProps) {
	const formRef = useRef<HTMLFormElement>(null);

	return (
		<form action={selectTeam} ref={formRef}>
			<Select
				name="teamId"
				defaultValue={currentTeam.id}
				onValueChange={() => {
					formRef.current?.requestSubmit();
				}}
			>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="Select Team" />
				</SelectTrigger>
				<SelectContent>
					{allTeams.map((team) => (
						<SelectItem key={team.id} value={team.id}>
							{team.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</form>
	);
}
