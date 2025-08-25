"use client";

import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle,
} from "@giselle-internal/ui/dialog";

import { X } from "lucide-react";
import { ViewTypeSelector } from "@/components/view-type-selector";
import { useViewPreferences } from "@/hooks/use-view-preferences";
import { cn } from "@/lib/utils";
import { buttonVariants } from "../../(main)/settings/components/button";

interface SettingsDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	isMobile: boolean;
}

export function SettingsDialog({
	isOpen,
	onOpenChange,
	isMobile,
}: SettingsDialogProps) {
	const { viewType, setViewType } = useViewPreferences();
	const handleClose = () => onOpenChange(false);

	if (isMobile) {
		return (
			isOpen && (
				<div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
					<div className="relative z-10 w-[90vw] max-w-[500px] max-h-[90vh] overflow-y-auto rounded-[12px] p-6 shadow-xl focus:outline-none">
						<div
							className="absolute inset-0 -z-10 rounded-[12px] backdrop-blur-md"
							style={{
								background:
									"linear-gradient(135deg, rgba(150, 150, 150, 0.03) 0%, rgba(60, 90, 160, 0.12) 100%)",
							}}
						/>
						<div className="absolute -z-10 top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
						<div className="absolute -z-10 inset-0 rounded-[12px] border border-white/10" />

						<div className="flex items-center justify-between mb-6">
							<h2 className="text-[20px] font-medium text-white-400 tracking-tight font-sans">
								View Style
							</h2>
							<button
								type="button"
								onClick={handleClose}
								className="p-1 rounded-lg hover:bg-white/10 transition-colors"
							>
								<X className="w-5 h-5 text-white-400" />
							</button>
						</div>

						<div className="mt-4">
							{/* View Type Selection */}
							<ViewTypeSelector
								viewType={viewType}
								onViewTypeChange={setViewType}
								layout="vertical"
								className="mb-6"
							/>

							{/* Font Options */}
							<div className="mb-6">
								<div className="block text-white-400 text-sm font-medium mb-3">
									Font
								</div>
								<div className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white-100 text-sm opacity-50">
									Coming Soon
								</div>
							</div>

							<div className="mt-6 flex justify-end gap-x-3">
								<button
									type="button"
									onClick={handleClose}
									className={cn(buttonVariants({ variant: "link" }))}
									aria-label="Cancel"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleClose}
									className={cn(
										buttonVariants({ variant: "primary" }),
										"whitespace-nowrap",
									)}
									aria-label="Continue"
								>
									Continue
								</button>
							</div>
						</div>
					</div>
				</div>
			)
		);
	}

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				<div className="flex items-center justify-between mb-6">
					<DialogTitle className="text-[20px] font-medium text-white-400 tracking-tight font-sans">
						View Style
					</DialogTitle>
					<button
						type="button"
						onClick={handleClose}
						className="p-1 rounded-lg hover:bg-white/10 transition-colors"
					>
						<X className="w-5 h-5 text-white-400" />
					</button>
				</div>

				{/* View Type Selection */}
				<ViewTypeSelector
					viewType={viewType}
					onViewTypeChange={setViewType}
					layout="horizontal"
					className="mb-6"
				/>

				{/* Font Options */}
				<div className="mb-6">
					<label
						htmlFor="font-select"
						className="block text-white-400 text-sm font-medium mb-3"
					>
						Font
					</label>
					<select
						id="font-select"
						disabled
						className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white-100 text-sm opacity-50 cursor-not-allowed"
					>
						<option className="bg-gray-900">Coming Soon</option>
					</select>
				</div>

				<DialogFooter>
					<div className="flex justify-end gap-x-3">
						<button
							type="button"
							onClick={handleClose}
							className={cn(buttonVariants({ variant: "link" }))}
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleClose}
							className={cn(buttonVariants({ variant: "primary" }))}
						>
							Continue
						</button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
