import { notFound } from "next/navigation";
import { PlaylistDetailClient } from "./playlist-detail-client";

interface PlaylistDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

// Mock playlist data - replace with actual database query
function fetchPlaylistById(id: string) {
	// TODO: Replace with actual database query
	// For now, return mock data
	const mockPlaylists = [
		{
			id: "1",
			title: "AI Writing Assistants",
			description:
				"A collection of AI agents focused on content creation and writing tasks",
			createdAt: new Date("2024-01-15"),
			updatedAt: new Date("2024-01-20"),
			apps: [
				{
					id: "app-1",
					name: "Blog Writer Pro",
					workspaceId: "workspace-1",
					updatedAt: new Date("2024-01-18"),
				},
				{
					id: "app-2",
					name: "Email Assistant",
					workspaceId: "workspace-2",
					updatedAt: new Date("2024-01-19"),
				},
				{
					id: "app-3",
					name: "Technical Documentation",
					workspaceId: "workspace-3",
					updatedAt: new Date("2024-01-20"),
				},
			],
		},
		{
			id: "2",
			title: "Data Analysis Tools",
			description: "Smart agents for data processing and insights generation",
			createdAt: new Date("2024-01-10"),
			updatedAt: new Date("2024-01-25"),
			apps: [
				{
					id: "app-4",
					name: "CSV Analyzer",
					workspaceId: "workspace-4",
					updatedAt: new Date("2024-01-22"),
				},
				{
					id: "app-5",
					name: "Report Generator",
					workspaceId: "workspace-5",
					updatedAt: new Date("2024-01-25"),
				},
			],
		},
	];

	return mockPlaylists.find((playlist) => playlist.id === id);
}

export default async function PlaylistDetailPage({
	params,
}: PlaylistDetailPageProps) {
	const { id } = await params;
	const playlist = await fetchPlaylistById(id);

	if (!playlist) {
		notFound();
	}

	return <PlaylistDetailClient playlist={playlist} />;
}
