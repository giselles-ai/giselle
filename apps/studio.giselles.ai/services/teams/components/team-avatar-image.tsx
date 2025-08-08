import Avatar from "boring-avatars";
import Image from "next/image";
import type { teams } from "@/drizzle";
import { cn } from "@/lib/utils";

export function TeamAvatarImage({
  profileImageUrl,
  teamName,
  width,
  height,
  className = "",
  alt = "",
}: {
  profileImageUrl?: typeof teams.$inferSelect.profileImageUrl;
  teamName: string;
  width: number;
  height: number;
  className?: string;
  alt?: string;
}) {
  return profileImageUrl ? (
    <Image
      src={profileImageUrl}
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
