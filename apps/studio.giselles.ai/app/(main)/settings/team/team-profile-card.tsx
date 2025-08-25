"use client";

import { useState } from "react";
import { TeamAvatarImage } from "@/services/teams/components/team-avatar-image";
import type { Team } from "@/services/teams/types";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { TeamProfileEditModal } from "./team-profile-edit-modal";

interface TeamProfileCardProps extends Team {
	avatarUrl?: string | null;
}

export function TeamProfileCard({
	id: teamId,
	name,
	avatarUrl,
}: TeamProfileCardProps) {
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	return (
		<Card
			title="Team Profile"
			description="This is your team's display name and profile image in Giselle."
			action={{
				component: (
					<Button
						onClick={() => setIsEditModalOpen(true)}
						className="rounded-lg px-4 py-2 text-white/80 transition-all duration-200 active:scale-[0.98]"
						style={{
							background: "linear-gradient(180deg, #202530 0%, #12151f 100%)",
							border: "1px solid rgba(0,0,0,0.7)",
							boxShadow:
								"inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 8px rgba(5,10,20,0.4), 0 1px 2px rgba(0,0,0,0.3)",
						}}
					>
						Edit
					</Button>
				),
			}}
			className="px-[24px] py-[16px]"
		>
			<div className="flex items-center gap-4">
				{/* Team profile image */}
				<div className="relative h-[48px] w-[48px] rounded-full overflow-hidden">
					<TeamAvatarImage
						avatarUrl={avatarUrl}
						teamName={name}
						width={48}
						height={48}
						alt={name}
						className="object-cover w-full h-full"
					/>
				</div>

				{/* Team name */}
				<span
					className="text-primary-100 font-normal text-[16px] font-sans px-3 py-2 rounded-[8px] flex-1 truncate"
					style={{
						background: "#00020A",
						boxShadow: "inset 0 1px 4px rgba(0,0,0,0.5)",
						border: "0.5px solid rgba(255,255,255,0.05)",
					}}
				>
					{name}
				</span>
			</div>

			{/* Team profile edit modal */}
			<TeamProfileEditModal
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				teamId={teamId}
				teamName={name}
				avatarUrl={avatarUrl}
				alt={name}
				onSuccess={() => {
					// Refresh the page to show updated data
					window.location.reload();
				}}
			/>
		</Card>
	);
}
