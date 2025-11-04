"use client";

import { Button } from "@giselle-internal/ui/button";
import {
	Dialog,
	DialogBody,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@giselle-internal/ui/dialog";
import { ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { maxLength, minLength, parse, pipe, string } from "valibot";
import { Input } from "@/components/ui/input";
import type { teams } from "@/db";
import { TeamAvatarImage } from "@/services/teams/components/team-avatar-image";
import { IMAGE_CONSTRAINTS } from "../constants";
import { updateTeamAvatar, updateTeamName } from "./actions";

const ACCEPTED_FILE_TYPES = IMAGE_CONSTRAINTS.formats.join(",");

const TeamNameSchema = pipe(
	string(),
	minLength(1, "Team name is required"),
	maxLength(256, "Team name must be 256 characters or less"),
);

interface TeamProfileEditModalProps {
	isOpen: boolean;
	onClose: () => void;
	teamId: typeof teams.$inferSelect.id;
	teamName: typeof teams.$inferSelect.name;
	avatarUrl?: typeof teams.$inferSelect.avatarUrl;
	alt?: string;
	onSuccess?: () => void;
}

export function TeamProfileEditModal({
	isOpen,
	onClose,
	teamId,
	teamName: initialTeamName,
	avatarUrl: initialAvatarUrl,
	alt,
	onSuccess,
}: TeamProfileEditModalProps) {
	// Profile image state
	const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
		null,
	);
	const [selectedProfileImageFile, setSelectedProfileImageFile] =
		useState<File | null>(null);
	const profileImageInputRef = useRef<HTMLInputElement>(null);

	// Team name state
	const [teamName, setTeamName] = useState(initialTeamName ?? "");

	// Shared state
	const [error, setError] = useState<string>("");
	const [profileImageError, setProfileImageError] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);

	// Derived validity state (simple consts)
	const trimmedTeamName = teamName.trim();
	const trimmedInitialTeamName = initialTeamName.trim();
	const isTeamNameChanged = trimmedTeamName !== trimmedInitialTeamName;
	let isTeamNameValid = true;
	if (isTeamNameChanged) {
		try {
			parse(TeamNameSchema, trimmedTeamName);
			isTeamNameValid = true;
		} catch {
			isTeamNameValid = false;
		}
	}
	const isProfileImageValid = profileImageError === "";
	const isFormSubmittable =
		(selectedProfileImageFile !== null || isTeamNameChanged) &&
		isTeamNameValid &&
		isProfileImageValid;

	// Reset when the modal opens/closes
	useEffect(() => {
		if (!isOpen) {
			// Clean up preview URL
			if (profileImagePreview) {
				URL.revokeObjectURL(profileImagePreview);
			}

			// Reset state
			setProfileImagePreview(null);
			setSelectedProfileImageFile(null);
			setTeamName(initialTeamName ?? "");
			setError("");
			setProfileImageError("");

			// Reset file input
			if (profileImageInputRef.current) {
				profileImageInputRef.current.value = "";
			}
		}
	}, [isOpen, initialTeamName, profileImagePreview]);

	// Clean up object URL on unmount or when preview changes
	useEffect(() => {
		return () => {
			if (profileImagePreview) {
				URL.revokeObjectURL(profileImagePreview);
			}
		};
	}, [profileImagePreview]);

	// Handle profile image file selection
	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		setProfileImageError("");
		const file = event.target.files?.[0];

		if (!file) return;

		if (!IMAGE_CONSTRAINTS.formats.includes(file.type)) {
			setProfileImageError("Please select a JPG, PNG, GIF, or WebP image");
			if (profileImagePreview) {
				URL.revokeObjectURL(profileImagePreview);
				setProfileImagePreview(null);
			}
			setSelectedProfileImageFile(null);
			return;
		}

		if (file.size >= IMAGE_CONSTRAINTS.maxSize) {
			setProfileImageError(
				`Please select an image under ${IMAGE_CONSTRAINTS.maxSize / (1024 * 1024)}MB in size`,
			);
			if (profileImagePreview) {
				URL.revokeObjectURL(profileImagePreview);
				setProfileImagePreview(null);
			}
			setSelectedProfileImageFile(null);
			return;
		}

		if (profileImagePreview) {
			URL.revokeObjectURL(profileImagePreview);
		}

		const objectUrl = URL.createObjectURL(file);
		setProfileImagePreview(objectUrl);
		setSelectedProfileImageFile(file);
	};

	// Handle team name change
	const handleTeamNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setError("");
		setTeamName(e.target.value);
	};

	// Open file selector
	const handleSelectImageClick = () => {
		profileImageInputRef.current?.click();
	};

	// Save all changes
	const handleSave = async () => {
		try {
			setIsLoading(true);
			setError("");
			setProfileImageError("");

			// Use memoized, trimmed values for validation and comparison
			const trimmedName = trimmedTeamName;
			const trimmedInitialName = trimmedInitialTeamName;

			// Validate team name if changed
			if (trimmedName !== trimmedInitialName) {
				try {
					parse(TeamNameSchema, trimmedName);
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

			// Update team name if changed
			if (trimmedName !== trimmedInitialName) {
				const formData = new FormData();
				formData.append("name", trimmedName);
				promises.push(updateTeamName(teamId, formData));
			}

			// Update avatar if changed
			if (selectedProfileImageFile) {
				const formData = new FormData();
				formData.append(
					"avatar",
					selectedProfileImageFile,
					selectedProfileImageFile.name,
				);
				promises.push(updateTeamAvatar(teamId, formData));
			}

			// Wait for all updates to complete
			const results = await Promise.all(promises);

			// Check if any updates failed
			const failedUpdate = results.find(
				(result: { success: boolean; error?: unknown }) => !result.success,
			);
			if (failedUpdate) {
				const errorMessage = failedUpdate.error
					? typeof failedUpdate.error === "string"
						? failedUpdate.error
						: "Update failed with unknown error"
					: "Failed to update team profile";
				throw new Error(errorMessage);
			}

			// Call success callback if provided
			if (onSuccess) {
				onSuccess();
			}

			// Close the modal
			onClose();
		} catch (error) {
			// More specific error handling
			if (error instanceof Error) {
				const errorMessage = error.message;
				// Handle specific error types
				if (
					errorMessage.includes("profile image") ||
					errorMessage.includes("image") ||
					errorMessage.includes("file")
				) {
					setProfileImageError(errorMessage);
				} else if (errorMessage.includes("name")) {
					setError(errorMessage);
				} else {
					setError(errorMessage);
				}
			} else {
				setError("Failed to save changes. Please try again.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open && !isLoading) onClose();
			}}
		>
			<DialogContent
				variant="glass"
				className="max-w-[420px]"
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
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle className="font-sans text-[20px] font-medium tracking-tight text-inverse">
							Edit Team Profile
						</DialogTitle>
						<DialogClose
							onClick={() => {
								if (!isLoading) onClose();
							}}
							className="rounded-sm text-inverse opacity-70 hover:opacity-100 focus:outline-none"
						>
							<X className="h-5 w-5" />
							<span className="sr-only">Close</span>
						</DialogClose>
					</div>
					<DialogDescription className="font-geist mt-2 text-[14px] text-text-muted">
						Update your team's name and profile image.
					</DialogDescription>
				</DialogHeader>
				<DialogBody className="mt-4">
					<div className="mt-4 flex flex-col items-center gap-6 w-full">
						{/* Hidden file input */}
						<Input
							ref={profileImageInputRef}
							type="file"
							accept={ACCEPTED_FILE_TYPES}
							className="hidden"
							onChange={handleFileSelect}
						/>

						{/* Profile Images */}
						<div className="flex items-center justify-center gap-4 w-full">
							<div className="flex flex-row gap-4">
								{/* Left side - clickable profile image */}
								{!profileImagePreview && (
									<button
										type="button"
										onClick={handleSelectImageClick}
										className="group relative w-[80px] h-[80px] rounded-full overflow-hidden cursor-pointer focus:outline-none focus:ring-0 border border-primary-100/20 hover:before:content-[''] hover:before:absolute hover:before:inset-0 hover:before:bg-black-900/40 hover:before:z-10"
									>
										<TeamAvatarImage
											avatarUrl={initialAvatarUrl}
											teamName={initialTeamName || "Team"}
											width={80}
											height={80}
											alt={alt}
											className="object-cover w-full h-full"
										/>
										<div className="absolute inset-0 flex items-center justify-center bg-black-900/50 opacity-0 group-hover:opacity-100 transition-opacity">
											<div className="w-[40px] h-[40px] rounded-full flex items-center justify-center">
												<ImageIcon className="w-7 h-7 text-inverse transform group-hover:scale-110 transition-transform" />
											</div>
										</div>
									</button>
								)}

								{/* Left side - preview image */}
								{profileImagePreview && (
									<button
										type="button"
										onClick={handleSelectImageClick}
										className="group relative w-[80px] h-[80px] rounded-full overflow-hidden cursor-pointer focus:outline-none focus:ring-0 border border-primary-100/30 hover:before:content-[''] hover:before:absolute hover:before:inset-0 hover:before:bg-black-900/40 hover:before:z-10"
										aria-label="Change team profile image"
									>
										<Image
											src={profileImagePreview}
											alt="Team profile preview"
											fill
											sizes="80px"
											className="object-cover w-full h-full scale-[1.02]"
											style={{ objectPosition: "center" }}
										/>
										<div className="absolute inset-0 flex items-center justify-center bg-black-900/50 opacity-0 group-hover:opacity-100 transition-opacity">
											<div className="w-[40px] h-[40px] rounded-full flex items-center justify-center">
												<ImageIcon className="w-7 h-7 text-inverse transform group-hover:scale-110 transition-transform" />
											</div>
										</div>
									</button>
								)}
							</div>
						</div>

						{/* Team name input (match Edit Profile style, use inverse text) */}
						<div className="w-full overflow-visible">
							<label
								htmlFor="teamName"
								className="block text-inverse text-left font-medium text-[12px] leading-[170%] font-geist mb-2"
							>
								Team Name
							</label>
							<div className="flex items-center gap-2 rounded-[12px] px-2 py-1 bg-[color-mix(in srgb,var(--color-text-inverse, #fff) 5%,transparent)] focus-within:ring-1 focus-within:ring-primary-100/50 focus-within:ring-inset transition-all">
								<input
									id="teamName"
									value={teamName}
									onChange={handleTeamNameChange}
									className="min-w-[200px] flex-1 border-none bg-transparent px-1 py-1 text-[14px] text-inverse outline-none placeholder:text-link-muted focus-visible:ring-0 focus-visible:shadow-none"
									disabled={isLoading}
								/>
							</div>
						</div>

						{/* Error message */}
						{(error || profileImageError) && (
							<p className="text-[12px] leading-[20.4px] text-error-900 font-geist">
								{error || profileImageError}
							</p>
						)}
					</div>
				</DialogBody>
				<DialogFooter>
					<div className="mt-6 flex justify-end gap-x-3">
						<Button
							type="button"
							variant="link"
							size="large"
							onClick={onClose}
							disabled={isLoading}
							aria-label="Cancel"
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="primary"
							size="large"
							onClick={handleSave}
							disabled={isLoading || !isFormSubmittable}
							aria-label={isLoading ? "Processing..." : "Save"}
						>
							{isLoading ? "Processing..." : "Save"}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
