"use client";

import { Button } from "@giselle-internal/ui/button";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Edit3, Play, Plus, Star, Trash2 } from "lucide-react";

import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { Card } from "../../../../(main)/settings/components/card";

interface App {
	id: string;
	name: string;
	workspaceId: string;
	updatedAt: Date;
}

interface Playlist {
	id: string;
	title: string;
	description: string;
	createdAt: Date;
	updatedAt: Date;
	apps: App[];
}

interface PlaylistDetailClientProps {
	playlist: Playlist;
}

export function PlaylistDetailClient({ playlist }: PlaylistDetailClientProps) {
	const router = useRouter();
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [editForm, setEditForm] = useState({
		title: playlist.title,
		description: playlist.description,
	});
	const [editError, setEditError] = useState("");
	const [isEditLoading, setIsEditLoading] = useState(false);

	const _handleBackClick = () => {
		router.push("/stage/showcase?tab=Playlist");
	};

	const handleEditPlaylist = () => {
		setIsEditDialogOpen(true);
		setEditForm({
			title: playlist.title,
			description: playlist.description,
		});
		setEditError("");
	};

	const handleSaveEdit = async () => {
		try {
			setIsEditLoading(true);
			setEditError("");

			// Validate title
			if (!editForm.title.trim()) {
				setEditError("Playlist title is required");
				setIsEditLoading(false);
				return;
			}

			// TODO: Implement actual save functionality
			console.log("Saving playlist:", editForm);

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			setIsEditDialogOpen(false);
		} catch (_error) {
			setEditError("Failed to save playlist. Please try again.");
		} finally {
			setIsEditLoading(false);
		}
	};

	const handleDeletePlaylist = () => {
		// TODO: Implement delete functionality
		console.log("Delete playlist:", playlist.id);
	};

	const handleAddApps = () => {
		// TODO: Implement add apps functionality
		console.log("Add apps to playlist:", playlist.id);
	};

	const handleAppClick = (app: App) => {
		router.push(`/stage/app-detail/${app.workspaceId}`);
	};

	const _handleAppKeyDown = (event: React.KeyboardEvent, app: App) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handleAppClick(app);
		}
	};

	const _formatDate = (date: Date) => {
		return new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		}).format(date);
	};

	return (
		<div className="flex-1 px-4 md:px-[24px] bg-[var(--color-stage-background)] pt-6 md:pt-0 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 h-full flex flex-col">
			<div className="py-4 md:py-6 h-full flex flex-col">
				{/* Breadcrumb Navigation */}
				<div className="mb-4 md:mb-6">
					<nav className="flex items-center text-xs md:text-sm text-[hsl(192,25%,65%)]">
						<button
							type="button"
							onClick={() => router.push("/stage/showcase")}
							className="hover:text-text transition-colors"
						>
							Showcase
						</button>
						<span className="mx-2">›</span>
						<button
							type="button"
							onClick={() => router.push("/stage/showcase?tab=Playlist")}
							className="hover:text-text transition-colors"
						>
							Playlist
						</button>
						<span className="mx-2">›</span>
						<span className="text-text font-medium">{playlist.title}</span>
					</nav>
				</div>

				{/* Spotify-like Header */}
				<div className="flex flex-col md:flex-row md:items-end gap-6 mb-6 md:mb-8">
					{/* Playlist Thumbnail */}
					<div className="w-[160px] h-[160px] md:w-[232px] md:h-[232px] rounded-lg bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex-shrink-0 shadow-2xl mx-auto md:mx-0">
						<div className="w-full h-full rounded-lg bg-black/20" />
					</div>

					{/* Playlist Info */}
					<div className="flex-1 pb-4 text-center md:text-left">
						<h1 className="text-[32px] md:text-[48px] font-black text-text mb-3 md:mb-4 leading-tight md:leading-none">
							{playlist.title}
						</h1>
						<p className="text-[hsl(192,25%,65%)] text-sm md:text-base mb-4 max-w-2xl mx-auto md:mx-0">
							{playlist.description}
						</p>
						<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-[hsl(192,25%,65%)]">
							<div className="flex items-center justify-center md:justify-start gap-1">
								<span className="text-white font-medium">Created by you</span>
								<span>•</span>
								<span>
									{playlist.apps.length}{" "}
									{playlist.apps.length === 1 ? "app" : "apps"}
								</span>
							</div>
							<div className="flex items-center justify-center md:justify-start gap-4">
								<Button
									onClick={handleAddApps}
									variant="solid"
									size="large"
									leftIcon={<Plus size={16} />}
									className="px-4 py-2 md:px-6 md:py-3 text-sm md:text-base"
								>
									Add Apps
								</Button>

								<DropdownMenu.Root>
									<DropdownMenu.Trigger asChild>
										<Button
											variant="subtle"
											size="compact"
											className="w-8 h-8 p-0 text-[hsl(192,25%,65%)] hover:text-text transition-colors"
										>
											<svg
												width={24}
												height={24}
												viewBox="0 0 24 24"
												fill="currentColor"
												stroke="none"
												className="w-6 h-6"
												aria-label="More options"
											>
												<title>More options</title>
												<circle cx="5" cy="12" r="2" />
												<circle cx="12" cy="12" r="2" />
												<circle cx="19" cy="12" r="2" />
											</svg>
										</Button>
									</DropdownMenu.Trigger>
									<DropdownMenu.Portal>
										<DropdownMenu.Content
											className="relative min-w-[180px] rounded-[12px] p-1 shadow-xl focus:outline-none backdrop-blur-md border border-white/10"
											sideOffset={5}
											style={{
												background:
													"linear-gradient(135deg, rgba(150, 150, 150, 0.03) 0%, rgba(60, 90, 160, 0.12) 100%)",
											}}
										>
											<div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
											<DropdownMenu.Item
												className="group flex items-center gap-3 text-sm text-white hover:text-white focus:text-white rounded-[8px] px-3 py-2 cursor-pointer transition-colors focus:outline-none focus:bg-white/5 hover:bg-white/5"
												onClick={handleEditPlaylist}
											>
												<Edit3 size={16} className="text-[hsl(192,25%,65%)]" />
												<span>Edit Playlist</span>
											</DropdownMenu.Item>
											<DropdownMenu.Item
												className="group flex items-center gap-3 text-sm text-red-400 hover:text-red-300 focus:text-red-300 rounded-[8px] px-3 py-2 cursor-pointer transition-colors focus:outline-none focus:bg-red-500/5 hover:bg-red-500/5"
												onClick={handleDeletePlaylist}
											>
												<Trash2 size={16} />
												<span>Delete Playlist</span>
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
								</DropdownMenu.Root>
							</div>
						</div>
					</div>
				</div>

				{/* Apps Section */}
				<div className="flex-1 flex flex-col">
					<div className="mb-4">
						<h2 className="text-text text-lg md:text-xl font-semibold">
							Apps in this playlist
						</h2>
					</div>

					{playlist.apps.length === 0 ? (
						<div className="flex-1 flex items-center justify-center">
							<div className="text-center text-[hsl(192,25%,65%)]">
								<div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
									<Play size={24} />
								</div>
								<p className="text-lg mb-2">No apps yet</p>
								<p className="text-sm">
									Add some apps to get started with this playlist
								</p>
							</div>
						</div>
					) : (
						<Card className="gap-0 py-1 md:py-2">
							{playlist.apps.map((app) => (
								<div
									key={app.id}
									className="group flex items-center justify-between px-3 md:px-2 py-4 md:py-3 first:border-t-0 border-t-[0.5px] border-[var(--color-border)] cursor-pointer"
								>
									<div className="flex items-center gap-3 min-w-0 flex-1">
										<div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 transition-all group-hover:bg-primary-100/20">
											<svg
												role="img"
												aria-label="App icon"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 486 640"
												className="h-5 w-5 text-white/40 transition-colors group-hover:text-primary-100"
												fill="currentColor"
											>
												<title>App Icon</title>
												<path d="M278.186 397.523C241.056 392.676 201.368 394.115 171.855 391.185C142.556 387.776 131.742 363.167 136.856 355.603C158.378 364.712 177.928 368.547 201.794 368.387C241.642 368.227 275.576 356.242 303.544 332.486C331.511 308.729 345.362 280.285 344.936 247.207C342.912 222.545 327.782 184.194 293.742 157.188C290.971 154.791 283.673 150.583 283.673 150.583C258.635 135.615 230.188 128.318 198.438 128.69C170.843 130.129 149.747 135.509 126.574 143.711C73.0358 162.781 54.7103 208.589 55.243 249.018V249.924C63.1273 312.298 93.8652 328.757 125.935 351.342L88.1651 394.913L89.1772 400.613C89.1772 400.613 144.527 399.441 174.412 401.998C257.783 410.84 291.877 467.408 292.516 511.14C293.209 560.784 250.431 625.022 180.645 625.555C81.2397 626.354 78.5229 422.292 78.5229 422.292L0 504.215C2.6636 550.237 46.613 601.958 82.5182 617.938C130.356 636.847 187.251 632.107 211.969 629.603C237.486 627.046 363.368 607.072 379.136 498.143C379.136 467.302 358.041 407.964 278.186 397.523ZM266.093 226.433C279.678 277.302 283.14 315.334 263.749 345.27C250.538 359.598 229.868 364.872 209.199 363.114C206.535 362.901 179.207 358.267 162.746 322.685C179.26 301.272 218.522 250.563 255.599 204.222C260.66 209.814 266.093 226.487 266.093 226.487V226.433ZM136.643 152.607H136.536C149.534 135.935 185.44 129.916 203.392 135.349C221.771 144.404 235.515 161.023 250.645 192.769L196.201 261.909L156.62 312.245C150.333 300.633 144.58 286.997 140.158 271.337C120.927 203.103 123.484 170.877 136.589 152.607H136.643Z" />
												<path d="M370.506 0C370.506 55.3433 310.362 106.638 255.013 106.638C310.362 106.638 370.506 157.933 370.506 213.277C370.506 157.933 430.65 106.638 486 106.638C430.650 106.638 370.506 55.3433 370.506 0Z" />
											</svg>
										</div>
										<div className="flex flex-col gap-y-1 min-w-0">
											<p className="text-sm md:text-[14px] font-sans text-text truncate">
												{app.name || "Untitled"}
											</p>
											<p className="text-xs md:text-[12px] font-geist text-text-muted">
												Edited {app.updatedAt.toLocaleDateString("en-US")}
											</p>
										</div>
									</div>

									{/* Action buttons */}
									<div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
										<button
											type="button"
											className="p-1 md:p-1.5 rounded-full hover:bg-white/10 text-text-muted hover:text-text transition-colors border border-white/20 hover:border-white/40"
											title="Run app"
											onClick={() => {
												if (app.workspaceId) {
													router.push(`/stage?workspaceId=${app.workspaceId}`);
												}
											}}
										>
											<Play className="h-3 w-3" />
										</button>
										<button
											type="button"
											onClick={() => {
												if (app.workspaceId) {
													router.push(`/workspaces/${app.workspaceId}`);
												} else {
													router.push("/playground");
												}
											}}
											className="rounded-lg px-2 md:px-3 py-1 md:py-1.5 text-text transition-all duration-200 active:scale-[0.98] text-xs md:text-sm"
											style={{
												background:
													"linear-gradient(180deg, #202530 0%, #12151f 100%)",
												border: "1px solid rgba(0,0,0,0.7)",
												boxShadow:
													"inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 8px rgba(5,10,20,0.4), 0 1px 2px rgba(0,0,0,0.3)",
											}}
										>
											Edit
										</button>
										<button
											type="button"
											className="p-1 md:p-1.5 rounded-md text-text-muted hover:text-text transition-colors"
										>
											<Star className="h-3 w-3 md:h-4 md:w-4 hover:fill-current" />
										</button>
									</div>
								</div>
							))}
						</Card>
					)}
				</div>
			</div>

			{/* Edit Dialog */}
			<Dialog.Root open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<Dialog.Portal>
					<Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
					<Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md mx-4 rounded-[12px] p-6 shadow-xl focus:outline-none z-50 backdrop-blur-md border border-white/10 bg-gradient-to-br from-white/10 to-white/5">
						<div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

						<Dialog.Title className="text-text text-lg font-semibold mb-4">
							Edit Playlist
						</Dialog.Title>

						<div className="space-y-4">
							<div>
								<label
									htmlFor="playlistTitle"
									className="block text-sm font-medium text-text mb-2"
								>
									Title
								</label>
								<input
									id="playlistTitle"
									type="text"
									value={editForm.title}
									onChange={(e) =>
										setEditForm({ ...editForm, title: e.target.value })
									}
									className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-text placeholder-[hsl(192,25%,65%)] focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="Enter playlist title"
								/>
							</div>

							<div>
								<label
									htmlFor="playlistDescription"
									className="block text-sm font-medium text-text mb-2"
								>
									Description
								</label>
								<textarea
									id="playlistDescription"
									value={editForm.description}
									onChange={(e) =>
										setEditForm({ ...editForm, description: e.target.value })
									}
									rows={3}
									className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-text placeholder-[hsl(192,25%,65%)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
									placeholder="Enter playlist description"
								/>
							</div>

							{editError && (
								<div className="text-red-400 text-sm">{editError}</div>
							)}
						</div>

						<div className="flex justify-end gap-3 mt-6">
							<Button
								onClick={() => setIsEditDialogOpen(false)}
								variant="subtle"
								size="compact"
								disabled={isEditLoading}
							>
								Cancel
							</Button>
							<Button
								onClick={handleSaveEdit}
								variant="solid"
								size="compact"
								disabled={isEditLoading || !editForm.title.trim()}
							>
								{isEditLoading ? "Saving..." : "Save"}
							</Button>
						</div>

						<Dialog.Close asChild>
							<button
								type="button"
								className="absolute top-4 right-4 text-[hsl(192,25%,65%)] hover:text-text transition-colors"
								aria-label="Close dialog"
							>
								<svg
									width={16}
									height={16}
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth={2}
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<title>Close dialog</title>
									<path d="M18 6L6 18" />
									<path d="M6 6l12 12" />
								</svg>
							</button>
						</Dialog.Close>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</div>
	);
}
