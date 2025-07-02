"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { maxLength, minLength, parse, pipe, string } from "valibot";
import { Input } from "@/components/ui/input";
import type { users } from "@/drizzle";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";
import { updateAvatar, updateDisplayName } from "../account/actions";
import { Button } from "../components/button";
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
		<Dialog.Root open={isOpen} onOpenChange={onClose}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
				<div className="fixed inset-0 flex items-center justify-center z-50 p-4">
					<Dialog.Content
						className="w-[90vw] max-w-[420px] max-h-[90vh] overflow-y-auto rounded-[12px] p-6 relative shadow-xl focus:outline-none"
						style={{
							animation: "fadeIn 0.2s ease-out",
							transformOrigin: "center",
						}}
						onEscapeKeyDown={onClose}
						onPointerDownOutside={onClose}
						aria-describedby={undefined}
					>
						{/* Glass effect layers */}
						<div
							className="absolute inset-0 rounded-[12px] backdrop-blur-md"
							style={{
								background:
									"linear-gradient(135deg, rgba(150, 150, 150, 0.03) 0%, rgba(60, 90, 160, 0.12) 100%)",
							}}
						/>
						<div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
						<div className="absolute inset-0 rounded-[12px] border border-white/10" />

						<div className="relative z-10">
							<div className="flex justify-between items-center">
								<Dialog.Title className="text-[20px] font-medium text-white-400 tracking-tight font-sans">
									Edit Profile
								</Dialog.Title>
								<Dialog.Close
									onClick={onClose}
									className="rounded-sm opacity-70 text-white-400 hover:opacity-100 focus:outline-none"
								>
									<X className="h-5 w-5" />
									<span className="sr-only">Close</span>
								</Dialog.Close>
							</div>
							<p className="text-[14px] text-black-400 font-geist mt-2">
								Update your display name and avatar.
							</p>

							<div className="mt-4 flex flex-col items-center gap-6 w-full">
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
									<div
										className="flex flex-col items-start p-2 rounded-[8px] w-full"
										style={{
											background: "#00020A",
											boxShadow: "inset 0 1px 4px rgba(0,0,0,0.5)",
											border: "0.5px solid rgba(255,255,255,0.05)",
										}}
									>
										<Input
											id="displayName"
											value={displayName}
											onChange={handleDisplayNameChange}
											className="w-full bg-transparent text-white-800 font-medium text-[14px] leading-[23.8px] font-geist shadow-none focus:text-white border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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
								<div className="flex justify-end items-center mt-6 w-full">
									<div className="flex w-full max-w-[280px] space-x-2 ml-auto">
										<Button
											variant="link"
											onClick={onClose}
											type="button"
											className="flex-1"
											disabled={isLoading}
										>
											Cancel
										</Button>
										<Button
											type="button"
											disabled={!hasChanges || isLoading}
											onClick={handleSave}
											className="flex-1 rounded-lg px-4 py-2 text-white/80 transition-all duration-200 active:scale-[0.98]"
											style={{
												background:
													"linear-gradient(180deg, #202530 0%, #12151f 100%)",
												border: "1px solid rgba(0,0,0,0.7)",
												boxShadow:
													"inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 8px rgba(5,10,20,0.4), 0 1px 2px rgba(0,0,0,0.3)",
											}}
										>
											{isLoading ? "Saving..." : "Save"}
										</Button>
									</div>
								</div>
							</div>
						</div>
					</Dialog.Content>
				</div>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
