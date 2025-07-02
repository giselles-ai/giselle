"use client";

import { Camera } from "lucide-react";
import { useState } from "react";
import type { users } from "@/drizzle";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";
import { updateAvatar } from "../account/actions";
import { AvatarUpload } from "./avatar-upload";

interface AccountImageFormProps {
	avatarUrl: typeof users.$inferSelect.avatarUrl;
	alt?: string;
}

export function AccountImageForm({ avatarUrl, alt }: AccountImageFormProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(
		avatarUrl,
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const handleUpload = async (file: File) => {
		try {
			const formData = new FormData();
			formData.append("avatar", file, file.name);
			formData.append("avatarUrl", file.name);

			setIsDialogOpen(false);
			setIsUploading(true);
			const result = await updateAvatar(formData);
			setCurrentAvatarUrl(result.avatarUrl);
		} catch (error) {
			console.error("Error uploading file:", error);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<>
			<button
				type="button"
				disabled={isUploading}
				onClick={() => setIsDialogOpen(true)}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						setIsDialogOpen(true);
					}
				}}
				className="group relative h-[60px] w-[60px] rounded-full overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-white-400"
			>
				<AvatarImage
					avatarUrl={currentAvatarUrl}
					width={60}
					height={60}
					alt={alt}
				/>

				{/* Overlay with camera icon */}
				{!isUploading && (
					<div className="absolute inset-0 flex items-center justify-center bg-black-900/60 opacity-0 group-hover:opacity-100 transition-opacity">
						<Camera className="w-6 h-6 text-white-800" />
					</div>
				)}

				{/* Loading overlay */}
				{isUploading && (
					<div className="absolute inset-0 flex items-center justify-center bg-black-900/60">
						<div className="h-5 w-5 animate-spin rounded-full border-2 border-white-800 border-t-transparent" />
					</div>
				)}
			</button>

			<AvatarUpload
				isOpen={isDialogOpen}
				onClose={() => !isUploading && setIsDialogOpen(false)}
				onUpload={handleUpload}
			/>
		</>
	);
}
