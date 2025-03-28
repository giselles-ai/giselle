"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/v2/ui/button";
import type { Team } from "@/services/teams/types";
import { useState } from "react";
import {
	type InferInput,
	maxLength,
	minLength,
	parse,
	pipe,
	string,
} from "valibot";
import { updateTeamName } from "../actions";

const TeamNameSchema = pipe(
	string(),
	minLength(1, "Team name is required"),
	maxLength(256, "Team name must be 256 characters or less"),
);

type TeamNameSchema = InferInput<typeof TeamNameSchema>;

export function TeamNameForm({ id: teamId, name }: Team) {
	const [isEditingTeam, setIsEditingTeam] = useState(false);
	const [teamName, setTeamName] = useState(name);
	const [tempTeamName, setTempTeamName] = useState(teamName);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string>("");

	const handleSaveTeamName = async () => {
		setError("");

		try {
			const validatedName = parse(TeamNameSchema, tempTeamName);

			setIsLoading(true);

			const formData = new FormData();
			formData.append("name", validatedName);
			const formAction = updateTeamName.bind(null, teamId);
			const result = await formAction(formData);

			if (result.success) {
				setTeamName(validatedName);
				setIsEditingTeam(false);
			} else {
				setError("Failed to update team name");
				console.error("Failed to update team name");
			}
		} catch (error) {
			if (error instanceof Error) {
				setError(error.message);
			}
			console.error("Error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancelTeamName = () => {
		setTempTeamName(teamName);
		setIsEditingTeam(false);
		setError("");
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setError("");
		setTempTeamName(e.target.value);
	};

	return (
		<div className="bg-transparent rounded-[8px] border-[0.5px] border-black-400 px-[24px] py-[16px] w-full">
			<div className="flex flex-col gap-2">
				<div className="flex justify-between items-center gap-2">
					<span className="text-white-400 font-normal text-[18px] leading-[21.6px] tracking-[-0.011em] font-hubot">
						{teamName}
					</span>
					<Dialog open={isEditingTeam} onOpenChange={setIsEditingTeam}>
						<DialogTrigger asChild>
							<Button>Edit</Button>
						</DialogTrigger>
						<DialogContent className="gap-y-6 px-[57px] py-[40px] max-w-[380px] w-full bg-black-900 border-none rounded-[16px] bg-linear-to-br/hsl from-black-600 to-black-250 sm:rounded-[16px]">
							<div
								aria-hidden="true"
								className="absolute inset-0 rounded-[16px] border-[0.5px] border-transparent bg-black-900 bg-clip-padding"
							/>
							<DialogHeader className="relative z-10">
								<DialogTitle className="text-white-800 font-semibold text-[20px] leading-[28px] font-hubot text-center">
									Change Your Team Name
								</DialogTitle>
							</DialogHeader>
							<form className="flex flex-col gap-y-4 relative z-10">
								<div className="flex flex-col gap-y-2">
									<Input
										id="tempTeamName"
										value={tempTeamName}
										onChange={handleChange}
										className="py-2 rounded-[8px] w-full bg-white-30/30 text-black-800 font-medium text-[12px] leading-[20.4px] font-geist shadow-none focus:text-white"
										disabled={isLoading}
									/>
									{error && (
										<p className="text-[12px] leading-[20.4px] text-error-900 font-geist">
											{error}
										</p>
									)}
								</div>
								<div className="flex justify-end space-x-4">
									<Button
										type="button"
										onClick={handleCancelTeamName}
										disabled={isLoading}
										className="w-full h-[38px] bg-transparent border-black-400 text-black-400 text-[16px] leading-[19.2px] tracking-[-0.04em] hover:bg-transparent hover:text-black-400"
									>
										Cancel
									</Button>
									<Button
										type="submit"
										disabled={isLoading || !!error}
										onClick={handleSaveTeamName}
										className="w-full h-[38px] text-[16px] leading-[19.2px] tracking-[-0.04em] "
									>
										Save
									</Button>
								</div>
							</form>
						</DialogContent>
					</Dialog>
				</div>
			</div>
		</div>
	);
}
