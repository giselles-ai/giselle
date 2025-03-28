"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/v2/ui/alert";
import { Button } from "@/components/v2/ui/button";
import { AlertCircle, UserPlus } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createTeam } from "../../actions/create-team";

function Submit({
	selectedPlan,
	teamName,
}: { selectedPlan: string; teamName: string }) {
	const { pending } = useFormStatus();
	return (
		<Button
			type="submit"
			variant="default"
			className="h-[38px] w-full transition-colors duration-200"
			disabled={pending || !teamName || !selectedPlan}
		>
			{selectedPlan === "pro" ? "Proceed to Payment" : "Create Team"}
		</Button>
	);
}

interface TeamCreationFormProps {
	canCreateFreeTeam: boolean;
	proPlanPrice: string;
	children?: React.ReactNode;
}

export function TeamCreationForm({
	canCreateFreeTeam,
	proPlanPrice,
	children,
}: TeamCreationFormProps) {
	const [teamName, setTeamName] = useState("");
	const [selectedPlan, setSelectedPlan] = useState("");

	return (
		<Dialog>
			<DialogTrigger asChild className="cursor-pointer">
				{children ?? (
					<UserPlus className="h-6 w-6 text-white hover:opacity-80" />
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px] gap-y-6 px-8 py-6 border-[0.5px] border-black-400 rounded-[8px] bg-black-900">
				<DialogHeader>
					<DialogTitle className="text-white-800 font-semibold text-[20px] leading-[28px] font-hubot text-center">
						Create New Team
					</DialogTitle>
				</DialogHeader>

				<form action={createTeam} className="space-y-4">
					<div className="flex flex-col gap-y-2">
						<Label
							htmlFor="teamName"
							className="text-white-800 font-medium text-[12px] leading-[20.4px] font-geist"
						>
							Team Name
						</Label>
						<Input
							id="teamName"
							name="teamName"
							value={teamName}
							onChange={(e) => setTeamName(e.target.value)}
							className="py-2 rounded-[8px] w-full bg-white-30/30 text-black-800 font-medium text-[12px] leading-[20.4px] font-geist shadow-none focus:text-white"
							placeholder="Enter team name"
						/>
					</div>
					<div className="space-y-4">
						<div className="flex flex-col gap-y-2">
							<Label className="text-white-800 font-medium text-[12px] leading-[20.4px] font-geist">
								Select Plan
							</Label>
							<RadioGroup
								name="selectedPlan"
								value={selectedPlan}
								onValueChange={setSelectedPlan}
								className="grid grid-cols-2 gap-4"
							>
								<Card
									className={`bg-black-850 border-[0.5px] border-black-400 ${
										canCreateFreeTeam ? "cursor-pointer" : "opacity-50"
									}`}
								>
									<label htmlFor="free">
										<CardHeader>
											<CardTitle className="text-white-400 text-[16px] leading-[27.2px] tracking-normal font-hubot">
												Free
											</CardTitle>
											<CardDescription className="text-black-400 font-medium text-[12px] leading-[20.4px] font-geist">
												Basic features for small teams
											</CardDescription>
										</CardHeader>
										<CardContent className="flex items-center">
											<RadioGroupItem
												value="free"
												id="free"
												disabled={!canCreateFreeTeam}
												className="text-blue-500"
											/>
											<Label
												htmlFor="free"
												className="ml-2 text-white-800 font-geist"
											>
												$0/month
											</Label>
										</CardContent>
									</label>
								</Card>
								<Card className="bg-black-850 border-[0.5px] border-black-400 cursor-pointer">
									<label htmlFor="pro">
										<CardHeader>
											<CardTitle className="text-white-400 text-[16px] leading-[27.2px] tracking-normal font-hubot">
												Pro
											</CardTitle>
											<CardDescription className="text-black-400 font-medium text-[12px] leading-[20.4px] font-geist">
												Advanced features & support
											</CardDescription>
										</CardHeader>
										<CardContent className="flex items-center">
											<RadioGroupItem
												value="pro"
												id="pro"
												className="text-primary-900"
											/>
											<Label
												htmlFor="pro"
												className="ml-2 text-white-800 font-geist"
											>
												{proPlanPrice}/month
											</Label>
										</CardContent>
									</label>
								</Card>
							</RadioGroup>
						</div>
						{!canCreateFreeTeam && (
							<Alert
								variant="destructive"
								className="bg-error-900/5 border-error-900/20"
							>
								<AlertCircle className="h-[18px] w-[18px] text-red-900/50" />
								<AlertDescription className="text-red-900/50 font-medium text-[12px] leading-[20.4px] tracking-normal font-geist">
									You already have a Free plan team. Please upgrade to Pro for
									additional teams.
								</AlertDescription>
							</Alert>
						)}
					</div>
					<Submit selectedPlan={selectedPlan} teamName={teamName} />
				</form>
			</DialogContent>
		</Dialog>
	);
}
