"use client";

import type { users } from "@/drizzle";
import { Camera } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { AvatarUpload } from "../avatar/avatar-upload";

interface AccountImageFormProps {
	// avatarUrl: typeof users.$inferSelect.avatarUrl;
	avatarUrl: null; // TODO: Implement avatar URL to users schema like above
	displayName: typeof users.$inferSelect.displayName;
}

export function AccountImageForm({
	avatarUrl,
	displayName,
}: AccountImageFormProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(
		avatarUrl,
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const getFallbackInitials = (name: string | null) => {
		if (!name) return "U";
		return name.charAt(0).toUpperCase();
	};

	const handleUpload = async (file: File) => {
		try {
			setIsUploading(true);

			// TODO: Implement file upload logic here
			// const formData = new FormData();
			// formData.append("avatar", file);
			// const response = await fetch("/api/upload", { method: "POST", body: formData });

			// TODO: Set new URL after successful upload
			// const { url } = await response.json();
			// setCurrentAvatarUrl(url);

			setIsDialogOpen(false);
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
				onClick={() => setIsDialogOpen(true)}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						setIsDialogOpen(true);
					}
				}}
				className="group relative h-[60px] w-[60px] rounded-full overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-white-400"
			>
				{currentAvatarUrl ? (
					<Image
						src={currentAvatarUrl}
						alt={`${displayName}'s avatar`}
						fill
						className="object-cover"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-black-400 text-white-800 text-[24px] font-medium">
						{getFallbackInitials(displayName)}
					</div>
				)}

				{/* Overlay with camera icon */}
				<div className="absolute inset-0 flex items-center justify-center bg-black-900/60 opacity-0 group-hover:opacity-100 transition-opacity">
					<Camera className="w-6 h-6 text-white-800" />
				</div>

				{/* Loading overlay */}
				{isUploading && (
					<div className="absolute inset-0 flex items-center justify-center bg-black-900/60">
						<div className="h-5 w-5 animate-spin rounded-full border-2 border-white-800 border-t-transparent" />
					</div>
				)}
			</button>

			<AvatarUpload
				isOpen={isDialogOpen}
				onClose={() => setIsDialogOpen(false)}
				onUpload={handleUpload}
			/>
		</>
	);
}
