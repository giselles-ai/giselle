import { GiselleIcon } from "@giselle-internal/workflow-designer-ui";
import { BellIcon } from "lucide-react";

export function MobileHeader() {
	return (
		<>
			<div className="md:hidden fixed top-0 left-0 right-0 bg-[var(--color-stage-background)] border-b border-white/10 px-4 z-20 h-16 flex items-center justify-between">
				{/* Left side: G icon + Stage */}
				<div className="flex items-center gap-2">
					<GiselleIcon className="text-inverse w-6 h-6" />
					<span className="text-inverse text-lg font-semibold">Stage</span>
				</div>

				{/* Right side: Icons */}
				<div className="flex items-center gap-4">
					<button
						type="button"
						className="text-white-700 hover:text-inverse transition-colors"
					>
						<BellIcon className="w-5 h-5" />
					</button>
				</div>
			</div>
			<div className="md:hidden h-16 w-full" />
		</>
	);
}
