"use client";
import {
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "@giselle-internal/ui/glass-dialog";
import { Select } from "@giselle-internal/ui/select";
import { useToasts } from "@giselle-internal/ui/toast";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import type { TeamRole } from "@/drizzle";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";
import { deleteTeamMember, updateTeamMemberRole } from "./actions";

type TeamMemberListItemProps = {
	userId: string;
	displayName: string | null;
	email: string | null;
	avatarUrl: string | null;
	role: TeamRole;
	currentUserRole: TeamRole;
	isProPlan: boolean;
	currentUserId: string;
};

export function TeamMemberListItem({
	userId,
	displayName,
	email,
	avatarUrl,
	role: initialRole,
	currentUserRole,
	isProPlan,
	currentUserId,
}: TeamMemberListItemProps) {
	const { toast } = useToasts();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [open, setOpen] = useState(false);
	const [role, setRole] = useState(initialRole);
	const user = userId;
	const currentUser = currentUserId;

	const canEditRole =
		isProPlan && currentUserRole === "admin" && user !== currentUser;
	const canRemove = user === currentUser || canEditRole;
	const hasMenu = canEditRole || canRemove;

	const handleRoleChange = (value: string) => {
		setRole(value as TeamRole);
		handleSaveRole();
	};

	const handleSaveRole = async () => {
		try {
			setIsLoading(true);
			const formData = new FormData();
			formData.append("userId", user);
			formData.append("role", role);

			const result = await updateTeamMemberRole(formData);
			if (result?.success) {
				// Update local state after successful server update
				setRole(role);
				toast(`Role updated: ${role}`, { type: "success" });
			} else {
				const msg = result?.error || "Failed to update role";
				setError(msg);
				toast(msg, { type: "error" });
			}
		} catch (e) {
			if (e instanceof Error) {
				setError(e.message);
				toast(e.message, { type: "error" });
			}
			console.error("Error updating role:", e);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteMember = async () => {
		try {
			setIsLoading(true);
			const formData = new FormData();
			formData.append("userId", user);
			formData.append("role", role);
			const result = await deleteTeamMember(formData);
			if (!result?.success) {
				const msg = result?.error || "Failed to delete member";
				setError(msg);
				toast(msg, { type: "error" });
			} else {
				toast("Member removed", { type: "success" });
			}
		} catch (e) {
			if (e instanceof Error) {
				setError(e.message);
				toast(e.message, { type: "error" });
			}
			console.error("Error deleting member:", e);
		} finally {
			setIsLoading(false);
			setOpen(false);
		}
	};

	return (
		<div className="group px-2 py-3 border-t-[0.5px] border-border-muted first:border-t-0 font-sans">
			<div className="flex items-center justify-between gap-2">
				<div className="flex gap-x-2 items-center">
					<div className="flex-shrink-0">
						<AvatarImage
							avatarUrl={avatarUrl}
							width={36}
							height={36}
							alt={displayName || email || ""}
						/>
					</div>
					<div className="flex flex-col gap-y-1 font-medium">
						<div className="text-inverse text-[14px] leading-[20.4px]">
							{displayName || "No display name"}
						</div>
						<div className="text-text/60 text-[12px] leading-[16px]">
							{email || "No email"}
						</div>
					</div>
				</div>
				<div className="flex justify-between gap-2">
					<div className="flex items-center gap-[5px]">
						{hasMenu ? (
							<Select
								id={`${userId}-role`}
								options={[
									{ value: "admin", label: "Admin" },
									{ value: "member", label: "Member" },
									...(canRemove
										? [{ value: "__remove__", label: "Remove" }]
										: []),
								]}
								placeholder="Role"
								value={role}
								onValueChange={(v) => {
									if (v === "__remove__") {
										setOpen(true);
										return;
									}
									if (canEditRole) handleRoleChange(v);
								}}
								renderOption={(opt) => (
									<span
										className={
											opt.value === "__remove__" ? "text-error-900" : undefined
										}
									>
										{opt.label}
									</span>
								)}
								itemClassNameForOption={(opt) =>
									opt.value === "__remove__"
										? "text-error-900 hover:bg-error-900/15 data-[highlighted]:bg-error-900/15 data-[highlighted]:text-error-900"
										: undefined
								}
								widthClassName="min-w-[140px]"
								triggerClassName="h-8"
							/>
						) : (
							<span className="capitalize text-text/60 font-medium text-[14px] leading-[16px] font-sans">
								{role}
							</span>
						)}
						<Dialog.Root open={open} onOpenChange={setOpen}>
							<GlassDialogContent variant="destructive">
								<GlassDialogHeader
									title="Remove Member"
									description="This will permanently delete this member and remove their access to your team."
									variant="destructive"
									onClose={() => setOpen(false)}
								/>
								<GlassDialogFooter
									variant="destructive"
									onCancel={() => setOpen(false)}
									onConfirm={handleDeleteMember}
									confirmLabel="Remove"
									isPending={isLoading}
								/>
							</GlassDialogContent>
						</Dialog.Root>
					</div>
				</div>
			</div>
			{error && (
				<div className="text-error-900 text-[12px] mt-1 ml-12">{error}</div>
			)}
		</div>
	);
}
