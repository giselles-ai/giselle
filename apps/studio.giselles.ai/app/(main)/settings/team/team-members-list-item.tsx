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
import Avatar from "boring-avatars";
import { Check, Ellipsis, Pencil, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/button";
import { deleteTeamMember, updateTeamMemberRole } from "./actions";

type TeamMemberListItemProps = {
	userId: string;
	displayName: string | null;
	email: string | null;
	role: TeamRole;
	currentUserRole: TeamRole;
	isProPlan: boolean;
	profileImage?: string | null;
};

export function TeamMemberListItem({
	userId,
	displayName,
	email,
	role: initialRole,
	currentUserRole,
	isProPlan,
	profileImage = null,
}: TeamMemberListItemProps) {
	const [isEditingRole, setIsEditingRole] = useState(false);
	const [tempRole, setTempRole] = useState(initialRole);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [open, setOpen] = useState(false);
	const [role, setRole] = useState(initialRole);
	const user = userId;
	const currentUser = "current-user-id"; // should come from getUserId() or similar

	const canEdit =
		isProPlan && currentUserRole === "admin" && user !== currentUser;

	const handleRoleChange = (value: string) => {
		setTempRole(value as TeamRole);
	};

	const handleSaveRole = async () => {
		try {
			setIsLoading(true);
			const formData = new FormData();
			formData.append("userId", user);
			formData.append("role", tempRole);

			const result = await updateTeamMemberRole(formData);
			if (result?.success) {
				// Update local state after successful server update
				setRole(tempRole);
				setIsEditingRole(false);
			} else {
				setError(result?.error || "Failed to update role");
			}
		} catch (e) {
			if (e instanceof Error) {
				setError(e.message);
			}
			console.error("Error updating role:", e);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancelRole = () => {
		setTempRole(role);
		setIsEditingRole(false);
		setError("");
	};

	const handleDeleteMember = async () => {
		try {
			setIsLoading(true);
			const formData = new FormData();
			formData.append("userId", user);
			formData.append("role", role);
			const result = await deleteTeamMember(formData);
			if (!result?.success) {
				setError(result?.error || "Failed to delete member");
			}
		} catch (e) {
			if (e instanceof Error) {
				setError(e.message);
			}
			console.error("Error deleting member:", e);
		} finally {
			setIsLoading(false);
			setOpen(false);
		}
	};

	return (
		<div className="px-2">
			<div className="flex items-center justify-between gap-4 py-4 border-b-[0.5px] border-black-400 font-hubot">
				<div className="flex gap-x-4 items-center">
					<div className="flex-shrink-0">
						<Avatar
							name={email || userId}
							variant="marble"
							size={32}
							colors={["#413e4a", "#73626e", "#b38184", "#f0b49e", "#f7e4be"]}
						/>
					</div>
					<div className="flex flex-col gap-y-1 font-medium text-[12px] leading-[12px]">
						<div className="text-blue-80">
							{displayName || "No display name"}
						</div>
						<div className="text-white-400">{email || "No email"}</div>
					</div>
				</div>
				<div className="flex justify-between gap-2">
					<div className="flex items-center gap-[5px]">
						{isEditingRole ? (
							<>
								<Select
									value={tempRole}
									onValueChange={handleRoleChange}
									disabled={isLoading}
								>
									<SelectTrigger className="px-4 py-2 border border-white-900 rounded-[8px] h-[40px] w-[123px] bg-transparent text-white-900 [&_svg]:opacity-100 cursor-pointer focus:ring-0 focus:ring-offset-0 focus:outline-none focus:border-white-900">
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
									className="shrink-0 h-[32px] w-[32px] rounded-full p-0 flex items-center justify-center"
									onClick={handleSaveRole}
									disabled={isLoading || !!error}
								>
									<Check className="h-4 w-4" />
								</Button>
								<Button
									className="group shrink-0 h-[32px] w-[32px] rounded-full p-0 bg-error-900 flex items-center justify-center border-0 hover:bg-transparent hover:border-2 hover:border-error-900 transition-colors"
									onClick={handleCancelRole}
									disabled={isLoading}
								>
									<X className="h-4 w-4 text-white group-hover:text-error-900" />
								</Button>
							</>
						) : (
							<>
								<span className="capitalize text-white-400 font-medium text-[14px] leading-[16px] text-end font-hubot">
									{role}
								</span>
								{canEdit && (
									<>
										<Button
											className="group shrink-0 h-[32px] w-[32px] rounded-full p-0 flex items-center justify-center bg-white-400 hover:bg-transparent hover:border hover:border-white-400 transition-colors"
											onClick={() => setIsEditingRole(true)}
										>
											<Pencil className="h-4 w-4 text-black-900 group-hover:text-white-400" />
										</Button>

										<DropdownMenu modal={false}>
											<DropdownMenuTrigger className="cursor-pointer">
												<Ellipsis className="text-white-350" />
											</DropdownMenuTrigger>
											<DropdownMenuContent
												align="end"
												className="px-0 py-2 border-[0.5px] border-error-900 rounded-[8px] min-w-[165px] bg-black-850 shadow-none"
											>
												<AlertDialog open={open} onOpenChange={setOpen}>
													<AlertDialogTrigger asChild>
														<button
															type="button"
															className="flex items-center w-full px-4 py-3 font-medium text-[14px] leading-[16px] text-error-900 hover:bg-black-700"
															disabled={isLoading}
														>
															Delete
														</button>
													</AlertDialogTrigger>
													<AlertDialogContent className="border-[0.5px] border-black-400 rounded-[8px] bg-black-850">
														<AlertDialogHeader>
															<AlertDialogTitle className="text-white-400 text-[20px] leading-[29px] font-geist">
																Delete Member
															</AlertDialogTitle>
															<AlertDialogDescription className="text-black-400 text-[14px] leading-[20.4px]">
																This will permanently delete this member and
																remove their access to your team.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter className="mt-4">
															<AlertDialogCancel
																className="py-2 px-4 border-[0.5px] border-black-400 rounded-[8px] font-hubot"
																disabled={isLoading}
															>
																Cancel
															</AlertDialogCancel>
															<AlertDialogAction
																onClick={handleDeleteMember}
																disabled={isLoading}
																className="py-2 px-4 bg-error-900 rounded-[8px] text-white-400 font-hubot"
															>
																Delete
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
				</div>
			</div>
			{error && (
				<div className="text-error-900 text-[12px] mt-1 ml-12">{error}</div>
			)}
		</div>
	);
}
