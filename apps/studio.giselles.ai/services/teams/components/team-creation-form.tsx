"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
	Alert,
	AlertDescription,
} from "@/app/(main)/settings/components/alert";
import { Button } from "@/app/(main)/settings/components/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { createTeam } from "../actions/create-team";

function Submit({
	selectedPlan,
	teamName,
}: {
	selectedPlan: string;
	teamName: string;
}) {
	const { pending } = useFormStatus();
	const isDisabled = pending || !teamName || !selectedPlan;

	const buttonStyle: React.CSSProperties = {
		background: "linear-gradient(180deg, #202530 0%, #12151f 100%)",
		border: "1px solid rgba(0,0,0,0.7)",
		boxShadow:
			"inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 8px rgba(5,10,20,0.4), 0 1px 2px rgba(0,0,0,0.3)",
	};

	if (isDisabled) {
		buttonStyle.opacity = 0.5;
	}

	return (
		<Button
			type="submit"
			disabled={isDisabled}
			className="w-full rounded-lg px-4 py-2 text-white/80 transition-all duration-200 active:scale-[0.98]"
			style={buttonStyle}
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
	// If free plan is not available, set "pro" as initial value, otherwise empty string
	const [selectedPlan, setSelectedPlan] = useState(
		canCreateFreeTeam ? "" : "pro",
	);
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
			<Dialog.Trigger
				asChild
				className="cursor-pointer"
				onClick={() => setIsOpen(true)}
			>
				{children ?? (
					<UserPlus className="h-6 w-6 text-white hover:opacity-80" />
				)}
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
				<div className="fixed inset-0 flex items-center justify-center z-50 p-4">
					<Dialog.Content
						className={cn(
							"w-[90vw] max-w-[640px] max-h-[90vh] overflow-y-auto rounded-[12px] p-6 relative",
							"shadow-xl focus:outline-none",
						)}
						onEscapeKeyDown={() => setIsOpen(false)}
						onPointerDownOutside={() => setIsOpen(false)}
					>
						{/* Glass effect layers */}
						<div
							className="absolute inset-0 rounded-[12px] backdrop-blur-md"
							style={{
								background:
									"linear-gradient(135deg, rgba(150, 150, 150, 0.03) 0%, rgba(60, 90, 160, 0.12) 100%)",
							}}
						/>
						<div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
						<div className="absolute inset-0 rounded-[12px] border border-white/10" />

						<div className="relative z-10">
							<div className="flex justify-between items-center">
								<Dialog.Title className="text-[20px] font-medium text-white-400 tracking-tight font-sans">
									Create New Team
								</Dialog.Title>
								<Dialog.Close
									onClick={() => setIsOpen(false)}
									className="rounded-sm opacity-70 text-white-400 hover:opacity-100 focus:outline-none"
								>
									<X className="h-5 w-5" />
									<span className="sr-only">Close</span>
								</Dialog.Close>
							</div>

							<form action={createTeam} className="space-y-4 mt-4">
								<div className="flex flex-col gap-y-2">
									<Label
										htmlFor="teamName"
										className="text-white-800 font-medium text-[12px] leading-[20.4px] font-geist"
									>
										Team Name
									</Label>
									<div
										className="flex flex-col items-start p-2 rounded-[8px] w-full"
										style={{
											background: "#00020A",
											boxShadow: "inset 0 1px 4px rgba(0,0,0,0.5)",
											border: "0.5px solid rgba(255,255,255,0.05)",
										}}
									>
										<Input
											id="teamName"
											name="teamName"
											value={teamName}
											onChange={(e) => setTeamName(e.target.value)}
											className="w-full bg-transparent text-white-800 font-medium text-[14px] leading-[23.8px] font-geist shadow-none focus:text-white border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-black-400"
											placeholder="Enter team name"
										/>
									</div>
								</div>
								<div className="space-y-4">
									<div className="flex flex-col gap-y-2">
										<Label className="text-white-800 font-medium text-[12px] leading-[20.4px] font-geist">
											{canCreateFreeTeam ? "Select Plan" : "Pro Plan"}
										</Label>
										{canCreateFreeTeam ? (
											<RadioGroup
												name="selectedPlan"
												value={selectedPlan}
												onValueChange={setSelectedPlan}
												className="grid grid-cols-2 gap-4"
											>
												<button
													type="button"
													onClick={() => setSelectedPlan("free")}
													className="cursor-pointer w-full text-left"
													aria-label="Select Free plan"
												>
													<Card
														className={cn(
															"bg-black-850 border-[0.5px] transition-all duration-200",
															selectedPlan === "free"
																? "border-blue-500 bg-blue-500/5"
																: "border-black-400 hover:border-black-300",
														)}
													>
														<CardHeader>
															<div className="flex flex-col gap-2">
																<CardTitle className="text-white-400 text-[16px] leading-[27.2px] tracking-normal font-sans">
																	Free
																</CardTitle>
																<div className="flex items-center mb-2">
																	<RadioGroupItem
																		value="free"
																		id="free"
																		className="text-blue-500 data-[state=checked]:border-[1.5px] data-[state=checked]:border-blue-500 pointer-events-none"
																	/>
																	<span className="ml-2 text-white-800 font-geist text-[16px]">
																		$0/month
																	</span>
																</div>
																<CardDescription className="text-white-400 font-semibold text-[12px] leading-[20.4px] font-geist">
																	Basic features for personal use
																</CardDescription>
																<CardDescription className="text-black-400 font-medium text-[12px] leading-[20.4px] font-geist">
																	Includes 30 minutes of model usage time and
																	access to basic models for your individual
																	projects.
																</CardDescription>
															</div>
														</CardHeader>
													</Card>
												</button>
												<button
													type="button"
													onClick={() => setSelectedPlan("pro")}
													className="cursor-pointer w-full text-left"
													aria-label="Select Pro plan"
												>
													<Card
														className={cn(
															"bg-black-850 border-[0.5px] transition-all duration-200",
															selectedPlan === "pro"
																? "border-primary-900 bg-primary-900/5"
																: "border-black-400 hover:border-black-300",
														)}
													>
														<CardHeader>
															<div className="flex flex-col gap-2">
																<CardTitle className="text-primary-400 text-[16px] leading-[27.2px] tracking-normal font-sans">
																	Pro
																</CardTitle>
																<div className="flex items-center mb-2">
																	<RadioGroupItem
																		value="pro"
																		id="pro"
																		className="text-primary-900 data-[state=checked]:border-[1.5px] data-[state=checked]:border-primary-900 pointer-events-none"
																	/>
																	<span className="ml-2 text-white-800 font-geist text-[16px]">
																		{proPlanPrice}/month
																	</span>
																</div>
																<CardDescription className="text-white-400 font-semibold text-[12px] leading-[20.4px] font-geist">
																	Advanced features & support
																</CardDescription>
																<CardDescription className="text-black-400 font-medium text-[12px] leading-[20.4px] font-geist">
																	When you create a team, all member seat
																	charges will be billed to you. Share apps with
																	multiple team members and gain access to
																	premium models, all with enhanced support.
																</CardDescription>
															</div>
														</CardHeader>
													</Card>
												</button>
											</RadioGroup>
										) : (
											<div className="w-full">
												<Alert className="border-primary-900/40 bg-primary-900/10">
													<AlertCircle className="h-4 w-4 text-primary-400" />
													<AlertDescription className="text-primary-400">
														You can only have one free team. Create a Pro team
														to collaborate with others.
													</AlertDescription>
												</Alert>
											</div>
										)}
									</div>
								</div>
								<div className="flex justify-end items-center mt-6">
									<div className="w-full">
										<Submit selectedPlan={selectedPlan} teamName={teamName} />
									</div>
								</div>
							</form>
						</div>
					</Dialog.Content>
				</div>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
