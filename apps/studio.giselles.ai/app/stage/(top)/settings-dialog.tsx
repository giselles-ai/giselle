"use client";

import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle,
} from "@giselle-internal/ui/dialog";
import clsx from "clsx/lite";
import { X } from "lucide-react";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { buttonVariants } from "../../(main)/settings/components/button";

interface SettingsDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	isMobile: boolean;
	isCarouselView: boolean;
	setIsCarouselView: (value: boolean) => void;
}

export function SettingsDialog({
	isOpen,
	onOpenChange,
	isMobile,
	isCarouselView,
	setIsCarouselView,
}: SettingsDialogProps) {
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
							<div className="mb-6">
								<Label className="text-white-800 font-medium text-[12px] leading-[20.4px] font-geist">
									Display Type
								</Label>
								<RadioGroup
									value={isCarouselView ? "carousel" : "list"}
									onValueChange={(value) =>
										setIsCarouselView(value === "carousel")
									}
									className="grid grid-cols-1 gap-3 mt-2"
								>
									<Card
										className={clsx(
											"cursor-pointer border-[1px]",
											!isCarouselView ? "border-blue-500" : "border-white/10",
										)}
									>
										<label htmlFor="list">
											<CardHeader className="p-3">
												<div className="flex items-center gap-3">
													<RadioGroupItem
														value="list"
														id="list"
														className="text-blue-500 data-[state=checked]:border-[1.5px] data-[state=checked]:border-blue-500"
													/>
													<div className="flex flex-col gap-1">
														<CardTitle className="text-white-400 text-[14px] font-sans">
															List
														</CardTitle>
														<CardDescription className="text-black-400 font-medium text-[12px] font-geist">
															Simple vertical list
														</CardDescription>
													</div>
												</div>
											</CardHeader>
										</label>
									</Card>
									<Card
										className={clsx(
											"cursor-pointer border-[1px]",
											isCarouselView ? "border-blue-500" : "border-white/10",
										)}
									>
										<label htmlFor="carousel">
											<CardHeader className="p-3">
												<div className="flex items-center gap-3">
													<RadioGroupItem
														value="carousel"
														id="carousel"
														className="text-blue-500 data-[state=checked]:border-[1.5px] data-[state=checked]:border-blue-500"
													/>
													<div className="flex flex-col gap-1">
														<CardTitle className="text-white-400 text-[14px] font-sans">
															Carousel
														</CardTitle>
														<CardDescription className="text-black-400 font-medium text-[12px] font-geist">
															Interactive circular layout
														</CardDescription>
													</div>
												</div>
											</CardHeader>
										</label>
									</Card>
								</RadioGroup>
							</div>

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
				<div className="mb-6">
					<Label className="text-white-800 font-medium text-[12px] leading-[20.4px] font-geist">
						Display Type
					</Label>
					<RadioGroup
						value={isCarouselView ? "carousel" : "list"}
						onValueChange={(value) => setIsCarouselView(value === "carousel")}
						className="grid grid-cols-2 gap-4 mt-2"
					>
						<Card
							className={clsx(
								"cursor-pointer border-[1px]",
								!isCarouselView ? "border-blue-500" : "border-white/10",
							)}
						>
							<label htmlFor="list">
								<CardHeader>
									<div className="flex flex-col gap-2">
										<CardTitle className="text-white-400 text-[16px] leading-[27.2px] tracking-normal font-sans">
											List
										</CardTitle>
										<div className="flex items-center mb-2">
											<RadioGroupItem
												value="list"
												id="list"
												className="text-blue-500 data-[state=checked]:border-[1.5px] data-[state=checked]:border-blue-500"
											/>
										</div>
										<CardDescription className="text-black-400 font-medium text-[12px] leading-[20.4px] font-geist">
											Simple vertical list
										</CardDescription>
									</div>
								</CardHeader>
							</label>
						</Card>
						<Card
							className={clsx(
								"cursor-pointer border-[1px]",
								isCarouselView ? "border-blue-500" : "border-white/10",
							)}
						>
							<label htmlFor="carousel">
								<CardHeader>
									<div className="flex flex-col gap-2">
										<CardTitle className="text-white-400 text-[16px] leading-[27.2px] tracking-normal font-sans">
											Carousel
										</CardTitle>
										<div className="flex items-center mb-2">
											<RadioGroupItem
												value="carousel"
												id="carousel"
												className="text-blue-500 data-[state=checked]:border-[1.5px] data-[state=checked]:border-blue-500"
											/>
										</div>
										<CardDescription className="text-black-400 font-medium text-[12px] leading-[20.4px] font-geist">
											Interactive circular layout
										</CardDescription>
									</div>
								</CardHeader>
							</label>
						</Card>
					</RadioGroup>
				</div>

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
