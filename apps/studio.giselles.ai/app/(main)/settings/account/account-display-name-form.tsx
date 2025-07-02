"use client";

import { useState } from "react";
import type { users } from "@/drizzle";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { ProfileEditModal } from "../components/profile-edit-modal";

export function AccountDisplayNameForm({
	displayName: _displayName,
	avatarUrl,
	alt,
}: {
	displayName: typeof users.$inferSelect.displayName;
	avatarUrl: typeof users.$inferSelect.avatarUrl;
	alt?: string;
}) {
	const [displayName, _setDisplayName] = useState(
		_displayName ?? "No display name",
	);
	const [currentAvatarUrl, _setCurrentAvatarUrl] = useState<string | null>(
		avatarUrl,
	);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	const handleProfileUpdate = () => {
		// We don't need to update state here as the page will be revalidated
		// after successful update through the server actions
		window.location.reload();
	};

	return (
		<Card title="" className="gap-y-2">
			<div className="flex flex-col gap-2">
				<div className="flex flex-col gap-2">
					<span className="text-white-400 font-medium text-[16px] leading-[19.2px] font-sans">
						Display Name
					</span>
					<p className="text-black-400 text-[14px] leading-[20.4px] font-geist">
						Please provide your preferred name or display name that you're
						comfortable using.
					</p>
				</div>
				<div className="flex justify-between items-center gap-2">
					<div className="flex items-center gap-4">
						{/* Avatar image (no longer clickable) */}
						<div className="relative h-[48px] w-[48px] rounded-full overflow-hidden">
							<AvatarImage
								avatarUrl={currentAvatarUrl}
								width={48}
								height={48}
								alt={alt}
								className="object-cover w-full h-full"
							/>
						</div>
						<span
							className="text-primary-100 font-normal text-[16px] leading-[19.2px] tracking-[-0.011em] font-sans px-3 py-2 rounded-[8px] w-[360px] truncate"
							style={{
								background: "#00020A",
								boxShadow: "inset 0 1px 4px rgba(0,0,0,0.5)",
								border: "0.5px solid rgba(255,255,255,0.05)",
							}}
						>
							{displayName}
						</span>
					</div>

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
				</div>
			</div>

			{/* Use the new integrated ProfileEditModal */}
			<ProfileEditModal
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				displayName={_displayName}
				avatarUrl={avatarUrl}
				alt={alt}
				onSuccess={handleProfileUpdate}
			/>
		</Card>
	);
}
