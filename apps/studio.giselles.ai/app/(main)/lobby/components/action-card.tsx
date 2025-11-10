import type { LucideIcon } from "lucide-react";

interface ActionCardProps {
	icon: LucideIcon;
	title: string;
	description: string;
	onClick: () => void;
	disabled?: boolean;
}

const cardBaseClasses =
	"relative rounded-[12px] overflow-hidden w-full h-24 bg-white/[0.02] backdrop-blur-[8px] border-[0.5px] border-border shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.2)] before:content-[''] before:absolute before:inset-0 before:bg-white before:opacity-[0.02] before:rounded-[inherit] before:pointer-events-none hover:border-border transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5 text-left px-4 flex items-center gap-3 group cursor-pointer";

const titleTextShadow =
	"0 0 8px rgba(255, 255, 255, 0.2), 0 0 16px rgba(255, 255, 255, 0.1)";

export function ActionCard({
	icon: Icon,
	title,
	description,
	onClick,
	disabled = false,
}: ActionCardProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={`${cardBaseClasses} disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0`}
		>
			<div className="w-10 h-10 flex items-center justify-center shrink-0 relative z-10">
				<Icon className="h-6 w-6 text-text" />
			</div>
			<div className="flex flex-col relative z-10">
				<span
					className="text-text font-medium"
					style={{ textShadow: titleTextShadow }}
				>
					{title}
				</span>
				<span className="text-text/60 text-sm">{description}</span>
			</div>
		</button>
	);
}
