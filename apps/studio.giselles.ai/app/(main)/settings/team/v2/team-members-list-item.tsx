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
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
				<div className="flex flex-col gap-y-1 font-medium text-[12px]">
					<div className="text-blue-80">
						{displayName || "No display name"}
					</div>
					<div className="text-white-400">{email || "No email"}</div>
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
									<SelectTrigger className="w-[100px]">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="admin">Admin</SelectItem>
										<SelectItem value="member">Member</SelectItem>
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
								<span className="text-zinc-400 capitalize w-[100px] text-end">
									{role}
								</span>
								{canEdit && (
									<>
										<Button
											className="rounded-full p-0 text-sm"
											onClick={() => setIsEditingRole(true)}
										>
											Manage Access
										</Button>

										<DropdownMenu>
											<DropdownMenuTrigger className="cursor-pointer">
												<Ellipsis />
											</DropdownMenuTrigger>
											<DropdownMenuContent
												align="end"
												className="px-0 py-2 border-[0.5px] border-black-400 rounded-[8px] min-w-[165px] bg-black-850"
											>
												{/* <DropdownMenuItem className=""> */}
												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button
															className="justify-start p-2 border-none w-full bg-transparent text-error-900 font-medium text-xs leading-[20.4px] tracking-normal font-geist hover:bg-primary-950/50"
															disabled={isLoading}
														>
															Remove from Team
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>
																Remove team member
															</AlertDialogTitle>
															<AlertDialogDescription>
																Are you sure you want to remove{" "}
																{displayName || email} from the team? This
																action cannot be undone.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>Cancel</AlertDialogCancel>
															<AlertDialogAction
																onClick={handleDelete}
																className="bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:text-white"
															>
																Remove
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
												{/* </DropdownMenuItem> */}
											</DropdownMenuContent>
										</DropdownMenu>
									</>
								)}
							</>
						)}
					</div>
					{error && <p className="text-sm text-destructive">{error}</p>}
				</div>
			</div>
		</div>
	);
}
