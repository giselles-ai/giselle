"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { maxLength, minLength, parse, pipe, string } from "valibot";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { users } from "@/db";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";
import { updateAvatar, updateDisplayName } from "../account/actions";
import { IMAGE_CONSTRAINTS } from "../constants";
import {
	GlassDialogBody,
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "../team/components/glass-dialog-content";

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

	// Derived validity state (simple consts)
	const trimmedDisplayName = displayName.trim();
	const trimmedInitialDisplayName = (initialDisplayName ?? "").trim();
	const isDisplayNameChanged = trimmedDisplayName !== trimmedInitialDisplayName;
	let isDisplayNameValid = true;
	if (isDisplayNameChanged) {
		try {
			parse(DisplayNameSchema, trimmedDisplayName);
			isDisplayNameValid = true;
		} catch {
			isDisplayNameValid = false;
		}
	}
	const isAvatarValid = avatarError === "";
	const isFormSubmittable =
		(selectedAvatarFile !== null || isDisplayNameChanged) &&
		isDisplayNameValid &&
		isAvatarValid;

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
			setAvatarError("Please select a JPG, PNG, GIF, or WebP image");
			if (avatarPreview) {
				URL.revokeObjectURL(avatarPreview);
				setAvatarPreview(null);
			}
			setSelectedAvatarFile(null);
			return;
		}

		if (file.size >= IMAGE_CONSTRAINTS.maxSize) {
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

			// Validate display name if changed (trim-aware)
			if (isDisplayNameChanged) {
				try {
					parse(DisplayNameSchema, trimmedDisplayName);
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

			// Update display name if changed (trim-aware)
			if (isDisplayNameChanged) {
				const formData = new FormData();
				formData.append("displayName", trimmedDisplayName);
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
		<Dialog.Root
			open={isOpen}
			onOpenChange={(open) => {
				if (!open && !isLoading) onClose();
			}}
		>
			<GlassDialogContent
				className="max-w-[420px]"
				borderStyle="solid"
				onEscapeKeyDown={(e) => {
					if (isLoading) {
						e.preventDefault();
						e.stopPropagation();
					}
				}}
				onPointerDownOutside={(e) => {
					if (isLoading) {
						e.preventDefault();
						e.stopPropagation();
					}
				}}
			>
				<GlassDialogHeader
					title="Edit Profile"
					description="Update your display name and avatar."
					onClose={() => {
						if (!isLoading) onClose();
					}}
				/>
				<GlassDialogBody>
					<div className="mt-2 flex flex-col items-center gap-6 w-full">
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
									<button
										type="button"
										onClick={handleSelectImageClick}
										className="group relative w-[80px] h-[80px] rounded-full overflow-hidden cursor-pointer focus:outline-none focus:ring-0 border border-primary-100/30 hover:before:content-[''] hover:before:absolute hover:before:inset-0 hover:before:bg-black-900/40 hover:before:z-10"
										aria-label="Change avatar"
									>
										<Image
											src={avatarPreview}
											alt="Avatar preview"
											fill
											sizes="80px"
											className="object-cover w-full h-full scale-[1.02]"
											style={{ objectPosition: "center" }}
										/>
										<div className="absolute inset-0 flex items-center justify-center bg-black-900/50 opacity-0 group-hover:opacity-100 transition-opacity">
											<div className="w-[40px] h-[40px] rounded-full flex items-center justify-center">
												<ImageIcon className="w-7 h-7 text-white-800 transform group-hover:scale-110 transition-transform" />
											</div>
										</div>
									</button>
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

						{/* Display name input (aligned with team dialogs style) */}
						<div className="w-full">
							<div className="grid gap-1">
								<Label htmlFor="displayName" className="text-text font-geist">
									Your Display Name
								</Label>
								<div
									className={`flex items-center gap-2 rounded-[12px] px-2 py-1 bg-inverse/5 ${error ? "ring-1 ring-error-900" : ""}`}
								>
									<Input
										id="displayName"
										name="displayName"
										type="text"
										value={displayName}
										onChange={handleDisplayNameChange}
										disabled={isLoading}
										className="min-w-[200px] flex-1 border-none bg-transparent px-1 py-1 text-[14px] text-inverse placeholder:text-inverse/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-100/50 focus-visible:ring-offset-0"
									/>
								</div>
							</div>
						</div>

						{/* Error message */}
						{(error || avatarError) && (
							<p className="text-[12px] leading-[20.4px] text-error-900 font-geist">
								{error || avatarError}
							</p>
						)}

						{/* Action buttons moved to GlassDialogFooter */}
					</div>
				</GlassDialogBody>
				<GlassDialogFooter
					onCancel={onClose}
					onConfirm={handleSave}
					confirmLabel={isLoading ? "Saving..." : "Save"}
					isPending={isLoading}
					isConfirmDisabled={!isFormSubmittable}
				/>
			</GlassDialogContent>
		</Dialog.Root>
	);
}
