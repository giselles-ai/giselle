import type { ReactNode } from "react";

interface glassContainerProps {
	children: ReactNode;
	className?: string;
	showDecorations?: boolean;
}

export function glassContainer({
	children,
	className = "",
	showDecorations = true,
}: glassContainerProps) {
	return (
		<div
			className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-900/50 backdrop-blur-2xl border border-white/10 shadow-2xl ${className}`}
		>
			{/* Inner glow */}
			<div className="absolute inset-0 bg-gradient-to-br from-slate-600/10 via-transparent to-transparent" />

			{/* Decorative cursor/arrow elements */}
			{showDecorations && (
				<>
					<div className="absolute top-6 right-8 flex gap-3">
						<div className="w-4 h-4 rotate-45 border-2 border-slate-400/60 bg-gradient-to-br from-slate-400/30 to-slate-600/20 rounded-sm" />
						<div className="w-3 h-3 rotate-12 border-2 border-slate-300/50 bg-gradient-to-br from-slate-300/30 to-slate-500/20 rounded-sm" />
					</div>
					<div className="absolute bottom-6 right-10 flex gap-2">
						<div className="w-3 h-3 -rotate-45 border border-slate-400/40 bg-gradient-to-br from-slate-400/20 to-slate-600/10 rounded-sm" />
						<div className="w-4 h-4 rotate-12 border-2 border-slate-300/60 bg-gradient-to-br from-slate-300/30 to-slate-500/20 rounded-sm" />
					</div>
				</>
			)}

			{/* Content */}
			<div className="relative p-2">{children}</div>
		</div>
	);
}
