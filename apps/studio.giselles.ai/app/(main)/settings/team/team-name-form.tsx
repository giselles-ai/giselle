"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import {
	type InferInput,
	maxLength,
	minLength,
	parse,
	pipe,
	string,
} from "valibot";
import { Input } from "@/components/ui/input";
import type { Team } from "@/services/teams/types";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { updateTeamName } from "./actions";
import {
	GlassDialogBody,
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "./components/glass-dialog-content";

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
		<Card
			title="Team Name"
			description="This is your team's display name in Giselle. You can use your company name or department."
			action={{
				component: (
					<Dialog.Root open={isEditingTeam} onOpenChange={setIsEditingTeam}>
						<Dialog.Trigger asChild>
							<Button
								className="rounded-lg px-4 py-2 text-white/80 transition-all duration-200 active:scale-[0.98]"
								style={{
									background:
										"linear-gradient(180deg, #202530 0%, #12151f 100%)",
									border: "1px solid rgba(0,0,0,0.7)",
									boxShadow:
										"inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 8px rgba(5,10,20,0.4), 0 1px 2px rgba(0,0,0,0.3)",
								}}
							>
								Edit
							</Button>
						</Dialog.Trigger>
						<GlassDialogContent
							onEscapeKeyDown={handleCancelTeamName}
							onPointerDownOutside={handleCancelTeamName}
						>
							<GlassDialogHeader
								title="Change Your Team Name"
								description="This is your team's display name in Giselle. You can use your company name or department."
								onClose={handleCancelTeamName}
							/>
							<GlassDialogBody>
								<form
									id="team-name-form"
									className="flex flex-col gap-y-4"
									onSubmit={(e) => {
										e.preventDefault();
										handleSaveTeamName();
									}}
								>
									<div className="flex flex-col gap-y-2">
										<Input
											id="tempTeamName"
											value={tempTeamName}
											onChange={handleChange}
											className="h-11 rounded-lg px-4 text-white placeholder-white/40 focus:outline-none focus:ring-0"
											style={{
												background: "#00020A",
												boxShadow: "inset 0 1px 4px rgba(0,0,0,0.5)",
											}}
											disabled={isLoading}
										/>
										{error && (
											<p className="font-geist text-[12px] leading-[20.4px] text-error-900">
												{error}
											</p>
										)}
									</div>
									<GlassDialogFooter
										onCancel={handleCancelTeamName}
										confirmLabel="Save"
										isPending={isLoading}
										confirmButtonType="submit"
									/>
								</form>
							</GlassDialogBody>
						</GlassDialogContent>
					</Dialog.Root>
				),
			}}
			className="px-[24px] py-[16px]"
		>
			<span
				className="text-primary-100 font-normal text-[16px] font-sans px-3 py-2 rounded-[4px] w-[360px] truncate"
				style={{
					background: "#00020A",
					boxShadow: "inset 0 1px 4px rgba(0,0,0,0.5)",
				}}
			>
				{teamName}
			</span>
		</Card>
	);
}
