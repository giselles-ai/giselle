import Avatar from "boring-avatars";
import Image from "next/image";
import type { users } from "@/db";
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
	// Normalize to a square to guarantee a perfect circle regardless of caller input
	const size = Math.max(width, height);
	const altText = alt ?? "";

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
					name={altText}
					variant="marble"
					width={size}
					height={size}
					colors={["#413e4a", "#73626e", "#b38184", "#f0b49e", "#f7e4be"]}
				/>
			)}
		</div>
	);
}
