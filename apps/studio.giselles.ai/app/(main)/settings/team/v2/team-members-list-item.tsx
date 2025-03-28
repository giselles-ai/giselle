"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/v2/ui/button";
import type { TeamRole } from "@/drizzle";
import { Check, Ellipsis, X } from "lucide-react";
import { useState } from "react";
import { deleteTeamMember, updateTeamMemberRole } from "../actions";

type TeamMemberListItemProps = {
	userId: string;
	displayName: string | null;
	email: string | null;
	role: TeamRole;
	currentUserRole: TeamRole;
	isProPlan: boolean;
};

export function TeamMemberListItem({
	userId,
	displayName,
	email,
	role: initialRole,
	currentUserRole,
	isProPlan,
}: TeamMemberListItemProps) {
	const [isEditingRole, setIsEditingRole] = useState(false);
	const [role, setRole] = useState<TeamRole>(initialRole);
	const [tempRole, setTempRole] = useState<TeamRole>(role);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string>("");

	const canEdit = currentUserRole === "admin" && isProPlan;
	const handleRoleChange = (value: TeamRole) => {
		setTempRole(value);
	};

	const handleSaveRole = async () => {
		setError("");

		try {
			setIsLoading(true);

			const formData = new FormData();
			formData.append("userId", userId);
			formData.append("role", tempRole);

			const { success, error } = await updateTeamMemberRole(formData);

			if (success) {
				setIsEditingRole(false);
				setRole(tempRole);
			} else {
				const errorMsg = error || "Failed to update role";
				setError(errorMsg);
				console.error(errorMsg);
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

	const handleCancelRole = () => {
		setTempRole(role);
		setIsEditingRole(false);
		setError("");
	};

	const handleDelete = async () => {
		setError("");

		try {
			setIsLoading(true);

			const formData = new FormData();
			formData.append("userId", userId);
			formData.append("role", role);

			const { success, error } = await deleteTeamMember(formData);

			if (!success) {
				const errorMsg = error || "Failed to delete member";
				setError(errorMsg);
				console.error(errorMsg);
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

	return (
		<div className="px-2">
			<div className="flex items-center justify-between items-center gap-4 py-4 border-b-[0.5px] border-black-400 font-hubot">
				<div className="flex gap-x-4">
					<div className="flex flex-col gap-y-1 font-medium text-[12px] leading-[12px]">
						<div className="text-blue-80">
							{displayName || "No display name"}
						</div>
						<div className="text-white-400">{email || "No email"}</div>
					</div>
				</div>
				<div className="flex justify-between gap-2">
					<div className="flex items-center gap-[10px]">
						{isEditingRole ? (
							<>
								<Select
									value={tempRole}
									onValueChange={handleRoleChange}
									disabled={isLoading}
								>
									<SelectTrigger className="px-4 py-2 border border-white-900 rounded-[8px] h-[40px] w-[123px] bg-transparent text-white-900 [&_svg]:opacity-100 cursor-pointer">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="border-[0.5px] border-black-400 rounded-[8px] bg-black-850 text-white-900 font-hubot">
										<SelectItem
											value="admin"
											className="py-2 pr-2 font-medium text-[12px] leading-[20.4px] transition duration-300 ease-out cursor-pointer focus:bg-primary-900/50"
										>
											Admin
										</SelectItem>
										<SelectItem
											value="member"
											className="py-2 pr-2 font-medium text-[12px] leading-[20.4px] transition duration-300 ease-out cursor-pointer focus:bg-primary-900/50"
										>
											Member
										</SelectItem>
									</SelectContent>
								</Select>
								<Button
									className="shrink-0 h-8 w-8 rounded-full p-0"
									onClick={handleSaveRole}
									disabled={isLoading || !!error}
								>
									<Check className="h-4 w-4" />
								</Button>
								<Button
									className="shrink-0 h-8 w-8 rounded-full p-0"
									onClick={handleCancelRole}
									disabled={isLoading}
								>
									<X className="h-4 w-4" />
								</Button>
							</>
						) : (
							<>
								<span className="capitalize text-black-300  font-medium text-[12px] leading-[12px] text-end font-hubot">
									{role}
								</span>
								{canEdit && (
									<>
										<Button
											className="px-2 border-white-400 bg-transparent text-white-400 font-medium text-[12px] leading-[12px]"
											onClick={() => setIsEditingRole(true)}
										>
											Manage Access
										</Button>

										<DropdownMenu modal={false}>
											<DropdownMenuTrigger className="cursor-pointer">
												<Ellipsis className="text-white-350" />
											</DropdownMenuTrigger>
											<DropdownMenuContent
												align="end"
												className="px-0 py-2 border-[0.5px] border-black-400 rounded-[8px] min-w-[165px] bg-black-850 shadow-none"
											>
												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button
															variant="destructive"
															className="justify-start p-2 border-none w-full bg-transparent text-error-900 font-medium text-[12px] leading-[20.4px] tracking-normal font-geist transition duration-300 ease-out hover:bg-primary-900/50"
															disabled={isLoading}
														>
															Remove from Team
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent className="px-8 py-6 border-[0.5px] border-black-400 rounded-[16px] bg-black-850">
														<AlertDialogHeader>
															<AlertDialogTitle className="text-white-800 font-bold text-[16px] leading-[16px] font-hubot">
																Remove Team Member
															</AlertDialogTitle>
															<AlertDialogDescription className="text-black-400 font-medium text-[12px] leading-[20.4px] font-geist">
																Are you sure you want to remove{" "}
																{displayName || email} from the team? This
																action cannot be undone.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter className="sm:space-x-4">
															<AlertDialogCancel className="px-5 py-1 border-black-400 h-[38px] bg-transparent text-black-400 font-semibold text-[16px] leading-[19.2px] tracking-[-0.04em] font-hubot cursor-pointer hover:bg-transparent hover:text-black-400">
																Cancel
															</AlertDialogCancel>
															<AlertDialogAction
																onClick={handleDelete}
																className="px-5 py-1 border-error-900 bg-error-900 h-[38px] text-destructive-foreground font-semibold text-[16px] leading-[19.2px] tracking-[-0.04em] font-hubot cursor-pointer hover:bg-transparent hover:text-error-900 dark:text-white-900"
															>
																Remove
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											</DropdownMenuContent>
										</DropdownMenu>
									</>
								)}
							</>
						)}
					</div>
					{error && (
						<p className="text-[12px] leading-[20.4px] text-error-900 font-geist">
							{error}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
