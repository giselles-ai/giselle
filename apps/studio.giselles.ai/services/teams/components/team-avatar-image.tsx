import Avatar from "boring-avatars";
import Image from "next/image";
import type { teams } from "@/db";
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
	const size = Math.max(width, height);
	const altText = alt || teamName || "";

	return (
		<div
			className={cn(
				"relative rounded-full overflow-hidden shrink-0",
				className,
			)}
			style={{ width: size, height: size }}
		>
			{avatarUrl ? (
				<Image
					src={avatarUrl}
					alt={altText}
					fill
					sizes={`${size}px`}
					className={"object-cover"}
					style={{ objectPosition: "center" }}
				/>
			) : (
				<Avatar
					name={teamName}
					variant="marble"
					width={size}
					height={size}
					colors={["#2563eb", "#7c3aed", "#dc2626", "#ea580c", "#16a34a"]}
				/>
			)}
		</div>
	);
}
