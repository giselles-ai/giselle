"use client";

import type { users } from "@/drizzle";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";
import { Camera } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/button";
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
	const [displayName, setDisplayName] = useState(
		_displayName ?? "No display name",
	);
	const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(
		avatarUrl,
	);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	const handleProfileUpdate = () => {
		// We don't need to update state here as the page will be revalidated
		// after successful update through the server actions
		window.location.reload();
	};

	return (
		<div className="bg-transparent rounded-[8px] border-[0.5px] border-black-400 px-[24px] py-[16px] w-full">
			<div className="flex flex-col gap-2">
				<div className="flex flex-col gap-2">
					<span className="text-white-400 font-medium text-[16px] leading-[19.2px] font-hubot">
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
						<div className="relative h-[60px] w-[60px] rounded-full overflow-hidden">
							<AvatarImage
								avatarUrl={currentAvatarUrl}
								width={60}
								height={60}
								alt={alt}
								className="object-cover w-full h-full"
							/>
						</div>
						<span className="text-primary-100 font-normal text-[18px] leading-[21.6px] tracking-[-0.011em] font-hubot px-3 py-2 border-[0.5px] border-black-750 rounded-[4px] bg-black-900 w-[360px] truncate">
							{displayName}
						</span>
					</div>

					<Button onClick={() => setIsEditModalOpen(true)}>Edit</Button>
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
		</div>
	);
}
