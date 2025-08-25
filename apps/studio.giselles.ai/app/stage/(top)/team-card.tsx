import type { InferSelectModel } from "drizzle-orm";
import type { teams } from "@/drizzle";

interface TeamCardProps {
	team?: Pick<InferSelectModel<typeof teams>, "id" | "name">;
}

export function TeamCard({ team }: TeamCardProps) {
	return (
		<div
			className="bg-[var(--color-stage-form-background)] border border-white/10 p-3"
			style={{
				width: "90px",
				height: "120px",
				borderRadius: "4px 4px 16px 4px",
				backgroundClip: "padding-box",
				overflow: "hidden",
			}}
		>
			<div className="space-y-1">
				<div
					className="text-[10px] text-white-900 leading-tight overflow-hidden text-left"
					style={{
						display: "-webkit-box",
						WebkitLineClamp: 2,
						WebkitBoxOrient:
							"vertical" as React.CSSProperties["WebkitBoxOrient"],
						wordBreak: "break-word",
						height: "24px", // 12px * 2 lines with spacing
					}}
				>
					{team?.name || "team name"}
				</div>
				<div className="flex justify-center">
					<div
						className="bg-gray-600 rounded-sm overflow-hidden flex items-center justify-center"
						style={{
							width: "66px",
							height: "66px",
						}}
					>
						<div className="text-gray-400 text-[12px] text-center">
							No Image
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
