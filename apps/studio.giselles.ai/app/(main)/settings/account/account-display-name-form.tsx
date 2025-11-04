"use client";

import { useState } from "react";
import type { users } from "@/db";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { ProfileEditModal } from "../components/profile-edit-modal";

export function AccountDisplayNameForm({
	displayName,
	avatarUrl,
	alt,
}: {
	displayName: typeof users.$inferSelect.displayName;
	avatarUrl: typeof users.$inferSelect.avatarUrl;
	alt?: string;
}) {
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	return (
		<Card title="" className="gap-y-2">
			<div className="flex flex-col gap-2">
				<div className="flex flex-col gap-2">
					<span className="text-inverse font-medium text-[16px] leading-[19.2px] font-sans">
						Display Name
					</span>
					<p className="text-text-muted text-[14px] leading-[20.4px] font-geist">
						Please provide your preferred name or display name that you're
						comfortable using.
					</p>
				</div>
				<div className="flex justify-between items-center gap-2">
					<div className="flex items-center gap-4">
						{/* Avatar image (no longer clickable) */}
						<div className="relative h-[48px] w-[48px] rounded-full overflow-hidden">
							<AvatarImage
								avatarUrl={avatarUrl}
								width={48}
								height={48}
								alt={alt}
								className="object-cover w-full h-full"
							/>
						</div>
						{/* Readonly display "input" area - open modal when clicked */}
						<button
							type="button"
							onClick={() => setIsEditModalOpen(true)}
							className="text-primary-100 font-normal text-[16px] leading-[19.2px] tracking-[-0.011em] font-sans px-3 py-2 rounded-[8px] w-[360px] truncate text-left cursor-pointer hover:bg-[color-mix(in_srgb,var(--color-text-inverse, #fff)_5%,transparent)] focus-visible:outline-none focus-visible:shadow-[0_0_0_1px_var(--color-focused)]"
							style={{
								background: "#00020A",
								boxShadow: "inset 0 1px 4px rgba(0,0,0,0.5)",
								border: "0.5px solid rgba(255,255,255,0.05)",
							}}
							aria-label="Edit display name"
						>
							{displayName ?? "No display name"}
						</button>
					</div>

					<Button
						onClick={() => setIsEditModalOpen(true)}
						className="rounded-lg px-4 py-2 text-inverse/80 transition-all duration-200 active:scale-[0.98]"
						style={{
							background: "linear-gradient(180deg, #202530 0%, #12151f 100%)",
							border: "1px solid rgba(0,0,0,0.7)",
							boxShadow:
								"inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 8px rgba(5,10,20,0.4), 0 1px 2px rgba(0,0,0,0.3)",
						}}
					>
						Edit
					</Button>
				</div>
			</div>

			{/* Use the new integrated ProfileEditModal */}
			<ProfileEditModal
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				displayName={displayName}
				avatarUrl={avatarUrl}
				alt={alt}
			/>
		</Card>
	);
}
