import Avatar from "boring-avatars";
import Image from "next/image";
import type { users } from "@/drizzle";
import { cn } from "@/lib/utils";

export function AvatarImage({
	avatarUrl,
	width,
	height,
	className = "",
	alt = "",
}: {
	avatarUrl: typeof users.$inferSelect.avatarUrl;
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
			alt={alt}
			className={cn("rounded-full object-cover w-full h-full", className)}
			style={{ objectPosition: "center" }}
		/>
	) : (
		<Avatar
			name={alt}
			variant="marble"
			width={width}
			height={height}
			colors={["#413e4a", "#73626e", "#b38184", "#f0b49e", "#f7e4be"]}
			className={cn("w-full h-full", className)}
		/>
	);
}
