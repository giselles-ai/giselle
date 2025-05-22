"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { users } from "@/drizzle";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";
import { Camera, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { maxLength, minLength, parse, pipe, string } from "valibot";
import { updateAvatar, updateDisplayName } from "../account/actions";
import { IMAGE_CONSTRAINTS } from "../constants";

const ACCEPTED_FILE_TYPES = IMAGE_CONSTRAINTS.formats.join(",");

const DisplayNameSchema = pipe(
	string(),
	minLength(1, "Display name is required"),
	maxLength(256, "Display name must be 256 characters or less"),
);

interface ProfileEditModalProps {
	isOpen: boolean;
	onClose: () => void;
	displayName: typeof users.$inferSelect.displayName;
	avatarUrl: typeof users.$inferSelect.avatarUrl;
	alt?: string;
	onSuccess?: () => void;
}

export function ProfileEditModal({
	isOpen,
	onClose,
	displayName: initialDisplayName,
	avatarUrl: initialAvatarUrl,
	alt,
	onSuccess,
}: ProfileEditModalProps) {
	// Avatar state
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
		null,
	);
	const avatarInputRef = useRef<HTMLInputElement>(null);

	// Display name state
	const [displayName, setDisplayName] = useState(
		initialDisplayName ?? "No display name",
	);

	// Shared state
	const [error, setError] = useState<string>("");
	const [avatarError, setAvatarError] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);
	const hasChanges =
		selectedAvatarFile !== null || displayName !== initialDisplayName;

	// Reset when the modal opens/closes
	useEffect(() => {
		if (!isOpen) {
			// Clean up preview URL
			if (avatarPreview) {
				URL.revokeObjectURL(avatarPreview);
			}

			// Reset state
			setAvatarPreview(null);
			setSelectedAvatarFile(null);
			setDisplayName(initialDisplayName ?? "No display name");
			setError("");
			setAvatarError("");

			// Reset file input
			if (avatarInputRef.current) {
				avatarInputRef.current.value = "";
			}
		}
	}, [isOpen, initialDisplayName, avatarPreview]);

	// Handle avatar file selection
	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		setAvatarError("");
		const file = event.target.files?.[0];

		if (!file) return;

		if (!IMAGE_CONSTRAINTS.formats.includes(file.type)) {
			setAvatarError("Please select a JPG, PNG, GIF, SVG, or WebP image");
			if (avatarPreview) {
				URL.revokeObjectURL(avatarPreview);
				setAvatarPreview(null);
			}
			setSelectedAvatarFile(null);
			return;
		}

		if (file.size > IMAGE_CONSTRAINTS.maxSize) {
			setAvatarError(
				`Please select an image under ${IMAGE_CONSTRAINTS.maxSize / (1024 * 1024)}MB in size`,
			);
			if (avatarPreview) {
				URL.revokeObjectURL(avatarPreview);
				setAvatarPreview(null);
			}
			setSelectedAvatarFile(null);
			return;
		}

		if (avatarPreview) {
			URL.revokeObjectURL(avatarPreview);
		}

		const objectUrl = URL.createObjectURL(file);
		setAvatarPreview(objectUrl);
		setSelectedAvatarFile(file);
	};

	// Handle display name change
	const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setError("");
		setDisplayName(e.target.value);
	};

	// Open file selector
	const handleSelectImageClick = () => {
		avatarInputRef.current?.click();
	};

	// Save all changes
	const handleSave = async () => {
		try {
			setIsLoading(true);
			setError("");
			setAvatarError("");

			// Validate display name if changed
			if (displayName !== initialDisplayName) {
				try {
					parse(DisplayNameSchema, displayName);
				} catch (valError) {
					if (valError instanceof Error) {
						setError(valError.message);
						setIsLoading(false);
						return;
					}
				}
			}

			// Save changes
			const promises = [];

			// Update display name if changed
			if (displayName !== initialDisplayName) {
				const formData = new FormData();
				formData.append("displayName", displayName);
				promises.push(updateDisplayName(formData));
			}

			// Update avatar if changed
			if (selectedAvatarFile) {
				const formData = new FormData();
				formData.append("avatar", selectedAvatarFile, selectedAvatarFile.name);
				formData.append("avatarUrl", selectedAvatarFile.name);
				promises.push(updateAvatar(formData));
			}

			// Wait for all updates to complete
			await Promise.all(promises);

			// Call success callback if provided
			if (onSuccess) {
				onSuccess();
			}

			// Close the modal
			onClose();
		} catch (error) {
			console.error("Failed to save profile changes:", error);
			if (error instanceof Error) {
				setError(error.message);
			} else {
				setError("Failed to save changes.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent
				className="flex flex-col items-center p-0 max-w-[380px] w-full bg-black-900 border-none rounded-[16px] bg-linear-to-br/hsl from-black-600 to-black-250 sm:rounded-[16px]"
				style={{
					animation: "fadeIn 0.2s ease-out",
					transformOrigin: "center",
				}}
				aria-describedby={undefined}
			>
				<style jsx global>{`
					@keyframes fadeIn {
						from {
							opacity: 0;
							transform: scale(0.95);
						}
						to {
							opacity: 1;
							transform: scale(1);
						}
					}
				`}</style>
				<div
					aria-hidden="true"
					className="absolute inset-0 rounded-[16px] border-[0.5px] border-transparent bg-black-900 bg-clip-padding"
				/>
				<DialogHeader className="relative z-10 w-full pt-[40px] mb-4 px-[24px]">
					<DialogTitle className="text-white-800 font-semibold text-[20px] leading-[28px] font-hubot text-center">
						Update Your Profile
					</DialogTitle>
					<DialogClose
						className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none"
						onClick={onClose}
					>
						<svg
							width="15"
							height="15"
							viewBox="0 0 15 15"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							className="h-4 w-4 text-white-800"
						>
							<title>Close</title>
							<path
								d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
								fill="currentColor"
								fillRule="evenodd"
								clipRule="evenodd"
							/>
						</svg>
					</DialogClose>
				</DialogHeader>

				<div className="relative z-10 flex flex-col items-center gap-6 w-full px-[24px] pb-[30px]">
					{/* Hidden file input */}
					<Input
						ref={avatarInputRef}
						type="file"
						accept={ACCEPTED_FILE_TYPES}
						className="hidden"
						onChange={handleFileSelect}
					/>

					{/* Avatar Profile Images */}
					<div className="flex items-center justify-center gap-4 w-full">
						<div className="flex flex-row gap-4">
							{/* Left side - clickable avatar */}
							{initialAvatarUrl && !avatarPreview && (
								<button
									type="button"
									onClick={handleSelectImageClick}
									className="group relative w-[80px] h-[80px] rounded-full overflow-hidden cursor-pointer focus:outline-none focus:ring-0 border border-primary-100/20 hover:before:content-[''] hover:before:absolute hover:before:inset-0 hover:before:bg-black-900/40 hover:before:z-10"
								>
									<AvatarImage
										avatarUrl={initialAvatarUrl}
										width={80}
										height={80}
										alt={alt}
										className="object-cover w-full h-full"
									/>
									<div className="absolute inset-0 flex items-center justify-center bg-black-900/50 opacity-0 group-hover:opacity-100 transition-opacity">
										<div className="w-[40px] h-[40px] rounded-full flex items-center justify-center">
											<ImageIcon className="w-7 h-7 text-white-800 transform group-hover:scale-110 transition-transform" />
										</div>
									</div>
								</button>
							)}

							{/* Left side - preview image */}
							{avatarPreview && (
								<div className="relative w-[80px] h-[80px] rounded-full overflow-hidden border border-primary-100/30">
									<Image
										src={avatarPreview}
										alt="Avatar preview"
										fill
										sizes="80px"
										className="object-cover w-full h-full scale-[1.02]"
										style={{ objectPosition: "center" }}
									/>
								</div>
							)}

							{/* Left side - image icon when no initial avatar */}
							{!initialAvatarUrl && !avatarPreview && (
								<button
									type="button"
									onClick={handleSelectImageClick}
									className="group relative w-[80px] h-[80px] rounded-full overflow-hidden cursor-pointer focus:outline-none focus:ring-0 bg-transparent border border-primary-100/20 flex items-center justify-center hover:before:content-[''] hover:before:absolute hover:before:inset-0 hover:before:bg-black-900/50 hover:before:z-10"
								>
									<ImageIcon className="w-7 h-7 text-white-800 transform group-hover:scale-110 transition-transform" />
								</button>
							)}
						</div>
					</div>

					{/* Display name input */}
					<div className="w-full">
						<label
							htmlFor="displayName"
							className="block text-white-800 text-left font-medium text-[12px] leading-[170%] font-geist mb-2"
						>
							Your Display Name
						</label>
						<div className="flex flex-col items-start p-2 rounded-[8px] bg-white/[0.29] w-full">
							<Input
								id="displayName"
								value={displayName}
								onChange={handleDisplayNameChange}
								className="w-full bg-transparent text-white-800 font-medium text-[12px] leading-[170%] font-geist shadow-none focus:text-white border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
								disabled={isLoading}
							/>
						</div>
					</div>

					{/* Error message */}
					{(error || avatarError) && (
						<p className="text-[12px] leading-[20.4px] text-error-900 font-geist">
							{error || avatarError}
						</p>
					)}

					{/* Action buttons */}
					<div className="flex justify-end gap-2 w-full">
						<Button
							type="button"
							onClick={onClose}
							disabled={isLoading}
							className="w-full h-[38px] bg-transparent border-black-400 text-black-400 text-[16px] leading-[19.2px] tracking-[-0.04em] hover:bg-transparent hover:text-black-400 transition-colors disabled:border-0 disabled:bg-black-400 disabled:text-black-600"
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleSave}
							disabled={!hasChanges || isLoading}
							className="w-full h-[38px] text-[16px] leading-[19.2px] tracking-[-0.04em] bg-primary-200 text-black-800 font-bold hover:bg-transparent hover:text-primary-200 hover:border-primary-200 transition-colors disabled:border-0 disabled:bg-black-400 disabled:text-black-600"
						>
							{isLoading ? (
								<div className="h-5 w-5 animate-spin rounded-full border-2 border-white-800 border-t-transparent" />
							) : (
								"Save"
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
