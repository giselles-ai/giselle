"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { maxLength, minLength, parse, pipe, string } from "valibot";
import { Input } from "@/components/ui/input";
import type { teams } from "@/drizzle";
import { TeamAvatarImage } from "@/services/teams/components/team-avatar-image";
import { IMAGE_CONSTRAINTS } from "../constants";
import { updateTeamName, updateTeamProfileImage } from "./actions";

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
	profileImageUrl?: typeof teams.$inferSelect.profileImageUrl;
	alt?: string;
	onSuccess?: () => void;
}

export function TeamProfileEditModal({
	isOpen,
	onClose,
	teamId,
	teamName: initialTeamName,
	profileImageUrl: initialProfileImageUrl,
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
	const hasChanges =
		selectedProfileImageFile !== null || teamName !== initialTeamName;

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
			setProfileImageError("Please select a JPG, PNG, GIF, SVG, or WebP image");
			if (profileImagePreview) {
				URL.revokeObjectURL(profileImagePreview);
				setProfileImagePreview(null);
			}
			setSelectedProfileImageFile(null);
			return;
		}

		if (file.size > IMAGE_CONSTRAINTS.maxSize) {
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

			// Validate team name if changed
			if (teamName !== initialTeamName) {
				try {
					parse(TeamNameSchema, teamName);
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
			if (teamName !== initialTeamName) {
				const formData = new FormData();
				formData.append("name", teamName);
				promises.push(updateTeamName(teamId, formData));
			}

			// Update profile image if changed
			if (selectedProfileImageFile) {
				const formData = new FormData();
				formData.append(
					"profileImage",
					selectedProfileImageFile,
					selectedProfileImageFile.name,
				);
				promises.push(updateTeamProfileImage(teamId, formData));
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
									Edit Team Profile
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
								Update your team's name and profile image.
							</p>

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
													profileImageUrl={initialProfileImageUrl}
													teamName={initialTeamName || "Team"}
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
										{profileImagePreview && (
											<div className="relative w-[80px] h-[80px] rounded-full overflow-hidden border border-primary-100/30">
												<Image
													src={profileImagePreview}
													alt="Team profile preview"
													fill
													sizes="80px"
													className="object-cover w-full h-full scale-[1.02]"
													style={{ objectPosition: "center" }}
												/>
											</div>
										)}
									</div>
								</div>

								{/* Team name input */}
								<div className="w-full">
									<label
										htmlFor="teamName"
										className="block text-white-800 text-left font-medium text-[12px] leading-[170%] font-geist mb-2"
									>
										Team Name
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
											id="teamName"
											value={teamName}
											onChange={handleTeamNameChange}
											className="w-full bg-transparent text-white-800 font-medium text-[14px] leading-[23.8px] font-geist shadow-none focus:text-white border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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

								{/* Action buttons */}
								<div className="flex justify-end items-center mt-6 w-full">
									<div className="flex w-full max-w-[280px] space-x-2 ml-auto">
										<button
											type="button"
											onClick={onClose}
											className="flex-1 text-white-400 hover:text-white-300 text-sm font-medium transition-colors"
											disabled={isLoading}
										>
											Cancel
										</button>
										<button
											type="button"
											disabled={!hasChanges || isLoading}
											onClick={handleSave}
											className="flex-1 rounded-lg px-4 py-2 text-white/80 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
											style={{
												background:
													"linear-gradient(180deg, #202530 0%, #12151f 100%)",
												border: "1px solid rgba(0,0,0,0.7)",
												boxShadow:
													"inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 8px rgba(5,10,20,0.4), 0 1px 2px rgba(0,0,0,0.3)",
											}}
										>
											{isLoading ? "Saving..." : "Save"}
										</button>
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
