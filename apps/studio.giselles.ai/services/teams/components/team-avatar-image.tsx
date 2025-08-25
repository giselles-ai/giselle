import Avatar from "boring-avatars";
import Image from "next/image";
import type { teams } from "@/drizzle";
import { cn } from "@/lib/utils";

export function TeamAvatarImage({
	avatarUrl,
	teamName,
	width,
	height,
	className = "",
	alt = "",
}: {
	avatarUrl?: typeof teams.$inferSelect.avatarUrl;
	teamName: string;
	width: number;
	height: number;
	className?: string;
	alt?: string;
}) {
	return avatarUrl ? (
		<Image
			src={avatarUrl}
			width={width}
			height={height}
			alt={alt || teamName}
			className={cn("rounded-full object-cover w-full h-full", className)}
			style={{ objectPosition: "center" }}
		/>
	) : (
		<Avatar
			name={teamName}
			variant="marble"
			width={width}
			height={height}
			colors={["#2563eb", "#7c3aed", "#dc2626", "#ea580c", "#16a34a"]}
			className={cn("w-full h-full", className)}
		/>
	);
}
