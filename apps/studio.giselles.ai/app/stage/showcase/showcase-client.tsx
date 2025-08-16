"use client";

import { Select } from "@giselle-internal/ui/select";
import * as Dialog from "@radix-ui/react-dialog";
import {
	ArrowDownAZ,
	ArrowUpAZ,
	Clock,
	Play,
	RotateCcw,
	Search,
	Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GlassButton } from "@/components/ui/glass-button";
import { Input } from "@/components/ui/input";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";
import { Card } from "../../(main)/settings/components/card";
import {
	GlassDialogBody,
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "../../(main)/settings/team/components/glass-dialog-content";

type SortOption = "name-asc" | "name-desc" | "date-desc" | "date-asc";

interface App {
	id: string;
	name: string | null;
	updatedAt: Date;
	workspaceId: string | null;
}

interface TeamOption {
	value: string;
	label: string;
	avatarUrl?: string;
}

interface ShowcaseClientProps {
	teamOptions: TeamOption[];
	teamApps: Record<string, App[]>;
	teamHistory: Record<string, App[]>;
}

export function ShowcaseClient({
	teamOptions,
	teamApps,
	teamHistory,
}: ShowcaseClientProps) {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<"Apps" | "Playlist" | "History">(
		"Apps",
	);

	// Playlist dialog state
	const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);
	const [playlistForm, setPlaylistForm] = useState({
		title: "",
		description: "",
	});

	// Apps tab states
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOption, setSortOption] = useState<SortOption>("date-desc");

	// Team selection state
	const [selectedTeamId, setSelectedTeamId] = useState<string>(
		teamOptions[0]?.value || "",
	);

	// Add CSS styles for team selection dropdown
	useEffect(() => {
		const styleElement = document.createElement("style");
		styleElement.textContent = `
      .team-select button[type="button"] {
        background-color: rgba(255, 255, 255, 0.05) !important;
        border: none !important;
        color: white !important;
        font-size: 14px !important;
        font-family: inherit !important;
      }
      .team-select button[type="button"]:hover {
        background-color: rgba(255, 255, 255, 0.1) !important;
      }
      .team-select button[type="button"] svg {
        margin-left: 8px !important;
      }
      .team-select [role="option"] {
        font-size: 14px !important;
      }
    `;
		document.head.appendChild(styleElement);

		return () => {
			document.head.removeChild(styleElement);
		};
	}, []);

	// Get apps for selected team
	const currentApps = useMemo(() => {
		return teamApps[selectedTeamId] || [];
	}, [teamApps, selectedTeamId]);

	// Get history for selected team
	const currentHistory = useMemo(() => {
		return teamHistory[selectedTeamId] || [];
	}, [teamHistory, selectedTeamId]);

	// Handle playlist form submission
	const handleSavePlaylist = () => {
		// TODO: Implement playlist creation logic
		console.log("Creating playlist:", playlistForm);
		setIsPlaylistDialogOpen(false);
		setPlaylistForm({ title: "", description: "" });
	};

	// Filter apps based on search query
	const filteredApps = useMemo(() => {
		if (!searchQuery) return currentApps;
		const query = searchQuery.toLowerCase();
		return currentApps.filter((app) => {
			const appName = (app.name || "Untitled").toLowerCase();
			return appName.includes(query);
		});
	}, [searchQuery, currentApps]);

	// Filter history based on search query
	const filteredHistory = useMemo(() => {
		if (!searchQuery) return currentHistory;
		const query = searchQuery.toLowerCase();
		return currentHistory.filter((item) => {
			const itemName = (item.name || "Untitled").toLowerCase();
			return itemName.includes(query);
		});
	}, [searchQuery, currentHistory]);

	// Sort apps based on selected option
	const sortedApps = useMemo(() => {
		return [...filteredApps].sort((a, b) => {
			switch (sortOption) {
				case "name-asc":
					return (a.name || "").localeCompare(b.name || "");
				case "name-desc":
					return (b.name || "").localeCompare(a.name || "");
				case "date-desc":
					return b.updatedAt.getTime() - a.updatedAt.getTime();
				case "date-asc":
					return a.updatedAt.getTime() - b.updatedAt.getTime();
				default:
					return 0;
			}
		});
	}, [filteredApps, sortOption]);

	// Sort history based on selected option
	const sortedHistory = useMemo(() => {
		return [...filteredHistory].sort((a, b) => {
			switch (sortOption) {
				case "name-asc":
					return (a.name || "").localeCompare(b.name || "");
				case "name-desc":
					return (b.name || "").localeCompare(a.name || "");
				case "date-desc":
					return b.updatedAt.getTime() - a.updatedAt.getTime();
				case "date-asc":
					return a.updatedAt.getTime() - b.updatedAt.getTime();
				default:
					return 0;
			}
		});
	}, [filteredHistory, sortOption]);

	// Team options with icons for the dropdown
	const teamOptionsWithIcons = useMemo(
		() =>
			teamOptions.map((team) => ({
				...team,
				icon: team.avatarUrl ? (
					<AvatarImage
						avatarUrl={team.avatarUrl}
						width={16}
						height={16}
						alt={team.label}
					/>
				) : undefined,
			})),
		[teamOptions],
	);

	return (
		<div className="flex-1 px-[24px] bg-[var(--color-stage-background)] pt-16 md:pt-0 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 h-full flex flex-col">
			<div className="py-6 h-full flex flex-col">
				<div className="flex items-center justify-between px-1 mb-6">
					<div>
						<h1
							className="text-[30px] font-sans font-medium text-[hsl(192,73%,84%)] mb-2"
							style={{
								textShadow:
									"0 0 20px #0087f6, 0 0 40px #0087f6, 0 0 60px #0087f6",
							}}
						>
							Showcase
						</h1>
						<p className="text-sm text-black-400">
							Explore featured workflows and inspiring examples
						</p>
					</div>

					{/* Team Selection Dropdown */}
					<div
						style={
							{
								width: "fit-content",
								minWidth: "auto",
							} as React.CSSProperties
						}
					>
						<div className="team-select">
							<Select
								placeholder="Select team"
								options={teamOptionsWithIcons}
								renderOption={(o) => o.label}
								value={selectedTeamId}
								onValueChange={(value) => setSelectedTeamId(value)}
								widthClassName="[&>button]:text-[14px] [&>button]:px-2 [&>button]:py-1 [&>button]:rounded-sm [&>button]:gap-2"
							/>
						</div>
					</div>
				</div>

				{/* Tabs */}
				<div className="mb-8">
					<div className="flex items-center px-0 py-0 border-t border-black-900/50">
						<div className="flex items-center space-x-[12px]">
							{["Apps", "Playlist", "History"].map((tab) => {
								const isActive = activeTab === tab;
								return (
									<button
										key={tab}
										type="button"
										onClick={() =>
											setActiveTab(tab as "Apps" | "Playlist" | "History")
										}
										className={`text-[16px] font-sans font-medium transition-colors px-2 py-2 relative rounded-md
                    ${
											isActive
												? "text-primary-100 [text-shadow:0px_0px_20px_#0087f6] after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-primary-100"
												: "text-black-70 hover:text-white-100 hover:after:content-[''] hover:after:absolute hover:after:left-0 hover:after:right-0 hover:after:bottom-0 hover:after:h-[2px] hover:after:bg-primary-100"
										}`}
									>
										{tab}
									</button>
								);
							})}
						</div>
					</div>
				</div>

				{/* Content area */}
				<div className="flex-1">
					{activeTab === "Apps" && (
						<>
							<div className="mb-4 flex flex-col sm:flex-row gap-3 items-center">
								<div className="relative flex-1 w-full">
									<Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black-300 h-4 w-4" />
									<Input
										type="text"
										placeholder="Search Apps..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-12 pr-4 h-10 w-full bg-black-700/50 border-black-600 text-white placeholder:text-black-400"
									/>
								</div>
								<div className="flex gap-2">
									{/* Sort Dropdown */}
									<Select
										options={[
											{
												value: "date-desc",
												label: "Updated",
												icon: <Clock className="h-4 w-4" />,
											},
											{
												value: "date-asc",
												label: "Oldest",
												icon: <Clock className="h-4 w-4" />,
											},
											{
												value: "name-asc",
												label: "Name (A-Z)",
												icon: <ArrowDownAZ className="h-4 w-4" />,
											},
											{
												value: "name-desc",
												label: "Name (Z-A)",
												icon: <ArrowUpAZ className="h-4 w-4" />,
											},
										]}
										placeholder="Sort"
										value={sortOption}
										onValueChange={(value) =>
											setSortOption(value as SortOption)
										}
									/>
								</div>
							</div>

							{sortedApps.length === 0 ? (
								searchQuery ? (
									<div className="flex justify-center items-center h-full mt-12">
										<div className="grid gap-[8px] justify-center text-center">
											<h3 className="text-[18px] font-geist font-bold text-black-400">
												No apps found.
											</h3>
											<p className="text-[12px] font-geist text-black-400">
												Try searching with a different keyword.
											</p>
										</div>
									</div>
								) : (
									<div className="flex justify-center items-center h-full mt-12">
										<div className="grid gap-[8px] justify-center text-center">
											<h3 className="text-[18px] font-geist font-bold text-black-400">
												No apps yet.
											</h3>
											<p className="text-[12px] font-geist text-black-400">
												Please create a new app with the 'New App +' button.
											</p>
										</div>
									</div>
								)
							) : (
								<Card className="gap-0 py-2">
									{sortedApps.map((app) => (
										<div
											key={app.id}
											className="group flex items-center justify-between px-2 py-3 first:border-t-0 border-t-[0.5px] border-white/10 cursor-pointer"
										>
											<div className="flex items-center gap-3">
												<div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 transition-all group-hover:bg-primary-100/20">
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
												<div className="flex flex-col gap-y-1">
													<p className="text-[14px] font-sans text-white-900">
														{app.name || "Untitled"}
													</p>
													<p className="text-[12px] font-geist text-white-400">
														Edited {app.updatedAt.toLocaleDateString("en-US")}
													</p>
												</div>
											</div>

											{/* Action buttons */}
											<div className="flex items-center gap-2">
												<button
													type="button"
													className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors border border-white/20 hover:border-white/40"
													title="Run app"
													onClick={() => {
														if (app.workspaceId) {
															router.push(
																`/stage?workspaceId=${app.workspaceId}&teamId=${selectedTeamId}`,
															);
														}
													}}
												>
													<Play className="h-3 w-3" />
												</button>
												<Link
													href={
														app.workspaceId
															? `/workspaces/${app.workspaceId}`
															: "/playground"
													}
													className="rounded-lg px-3 py-1.5 text-white/80 transition-all duration-200 active:scale-[0.98] text-sm"
													style={{
														background:
															"linear-gradient(180deg, #202530 0%, #12151f 100%)",
														border: "1px solid rgba(0,0,0,0.7)",
														boxShadow:
															"inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 8px rgba(5,10,20,0.4), 0 1px 2px rgba(0,0,0,0.3)",
													}}
													onClick={() => {
														console.log("🔗 Edit button clicked for app:", {
															id: app.id,
															name: app.name,
															workspaceId: app.workspaceId,
															targetUrl: app.workspaceId
																? `/workspaces/${app.workspaceId}`
																: "/playground",
														});
													}}
												>
													Edit
												</Link>
												<button
													type="button"
													className="p-1.5 rounded-md text-white/60 hover:text-white transition-colors"
												>
													<Star className="h-4 w-4 hover:fill-current" />
												</button>
											</div>
										</div>
									))}
								</Card>
							)}
						</>
					)}

					{activeTab === "Playlist" && (
						<div className="flex justify-center items-center h-full">
							<div className="grid gap-[8px] justify-center text-center">
								<h3 className="text-[18px] font-geist font-bold text-black-400">
									No playlists yet.
								</h3>
								<p className="text-[12px] font-geist text-black-400">
									Please create a new playlist with the 'New Playlist +' button.
								</p>
								<div className="mt-4">
									<Dialog.Root
										open={isPlaylistDialogOpen}
										onOpenChange={setIsPlaylistDialogOpen}
									>
										<Dialog.Trigger asChild>
											<GlassButton>Create Playlist</GlassButton>
										</Dialog.Trigger>
										<GlassDialogContent
											onEscapeKeyDown={() => setIsPlaylistDialogOpen(false)}
											onPointerDownOutside={() =>
												setIsPlaylistDialogOpen(false)
											}
										>
											<GlassDialogHeader
												title="New Playlist Details"
												description="Create a new playlist with title, description and thumbnail."
												onClose={() => setIsPlaylistDialogOpen(false)}
											/>
											<GlassDialogBody>
												<div className="grid gap-4">
													<div className="grid gap-2">
														<label
															htmlFor="title"
															className="text-sm font-medium text-white"
														>
															Title
														</label>
														<Input
															id="title"
															value={playlistForm.title}
															onChange={(e) =>
																setPlaylistForm({
																	...playlistForm,
																	title: e.target.value,
																})
															}
															placeholder="Playlist title"
															className="bg-black-700/50 border-black-600 text-white placeholder:text-black-400"
														/>
													</div>
													<div className="grid gap-2">
														<label
															htmlFor="description"
															className="text-sm font-medium text-white"
														>
															Description
														</label>
														<textarea
															id="description"
															value={playlistForm.description}
															onChange={(e) =>
																setPlaylistForm({
																	...playlistForm,
																	description: e.target.value,
																})
															}
															placeholder="Playlist description"
															className="min-h-[80px] px-3 py-2 rounded-md bg-black-700/50 border border-black-600 text-white placeholder:text-black-400 resize-none"
															rows={3}
														/>
													</div>
												</div>
											</GlassDialogBody>
											<GlassDialogFooter
												onCancel={() => setIsPlaylistDialogOpen(false)}
												onConfirm={handleSavePlaylist}
												confirmLabel="Save"
											/>
										</GlassDialogContent>
									</Dialog.Root>
								</div>
							</div>
						</div>
					)}

					{activeTab === "History" && (
						<>
							<div className="mb-4 flex flex-col sm:flex-row gap-3 items-center">
								<div className="relative flex-1 w-full">
									<Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black-300 h-4 w-4" />
									<Input
										type="text"
										placeholder="Search History..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-12 pr-4 h-10 w-full bg-black-700/50 border-black-600 text-white placeholder:text-black-400"
									/>
								</div>
								<div className="flex gap-2">
									{/* Sort Dropdown */}
									<Select
										options={[
											{
												value: "date-desc",
												label: "Updated",
												icon: <Clock className="h-4 w-4" />,
											},
											{
												value: "date-asc",
												label: "Oldest",
												icon: <Clock className="h-4 w-4" />,
											},
											{
												value: "name-asc",
												label: "Name (A-Z)",
												icon: <ArrowDownAZ className="h-4 w-4" />,
											},
											{
												value: "name-desc",
												label: "Name (Z-A)",
												icon: <ArrowUpAZ className="h-4 w-4" />,
											},
										]}
										placeholder="Sort"
										value={sortOption}
										onValueChange={(value) =>
											setSortOption(value as SortOption)
										}
									/>
								</div>
							</div>

							{sortedHistory.length === 0 ? (
								searchQuery ? (
									<div className="flex justify-center items-center h-full mt-12">
										<div className="grid gap-[8px] justify-center text-center">
											<h3 className="text-[18px] font-geist font-bold text-black-400">
												No history found.
											</h3>
											<p className="text-[12px] font-geist text-black-400">
												Try searching with a different keyword.
											</p>
										</div>
									</div>
								) : (
									<div className="flex justify-center items-center h-full mt-12">
										<div className="grid gap-[8px] justify-center text-center">
											<h3 className="text-[18px] font-geist font-bold text-black-400">
												No history yet.
											</h3>
											<p className="text-[12px] font-geist text-black-400">
												Execute an app to see your history.
											</p>
										</div>
									</div>
								)
							) : (
								<Card className="gap-0 py-2">
									{sortedHistory.map((item) => (
										<div
											key={item.id}
											className="group flex items-center justify-between px-2 py-3 first:border-t-0 border-t-[0.5px] border-white/10 cursor-pointer"
										>
											<div className="flex items-center gap-3">
												<div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 transition-all group-hover:bg-primary-100/20">
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
												<div className="flex flex-col gap-y-1">
													<p className="text-[14px] font-sans text-white-900">
														{item.name || "Untitled"}
													</p>
													<p className="text-[12px] font-geist text-white-400">
														Executed{" "}
														{item.updatedAt.toLocaleDateString("en-US")}
													</p>
												</div>
											</div>

											{/* Action buttons */}
											<div className="flex items-center gap-2">
												<button
													type="button"
													className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors border border-white/20 hover:border-white/40"
													title="Re-run app"
													onClick={() => {
														if (item.workspaceId) {
															router.push(
																`/stage?workspaceId=${item.workspaceId}&teamId=${selectedTeamId}`,
															);
														}
													}}
												>
													<RotateCcw className="h-3 w-3" />
												</button>

												<button
													type="button"
													className="p-1.5 rounded-md text-white/60 hover:text-white transition-colors"
												>
													<Star className="h-4 w-4 hover:fill-current" />
												</button>
											</div>
										</div>
									))}
								</Card>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
