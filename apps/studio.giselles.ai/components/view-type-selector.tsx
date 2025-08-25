"use client";

import clsx from "clsx/lite";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ViewType } from "@/hooks/use-view-preferences";

interface ViewTypeSelectorProps {
	viewType: ViewType;
	onViewTypeChange: (viewType: ViewType) => void;
	layout?: "horizontal" | "vertical";
	className?: string;
}

export function ViewTypeSelector({
	viewType,
	onViewTypeChange,
	layout = "horizontal",
	className,
}: ViewTypeSelectorProps) {
	const gridClass = layout === "horizontal" ? "grid-cols-2" : "grid-cols-1";

	return (
		<div className={className}>
			<Label className="text-white-800 font-medium text-[12px] leading-[20.4px] font-geist">
				Display Type
			</Label>
			<RadioGroup
				value={viewType}
				onValueChange={onViewTypeChange}
				className={clsx("grid gap-3 mt-2", gridClass)}
			>
				<Card
					className={clsx(
						"cursor-pointer border-[1px]",
						viewType === "list" ? "border-blue-500" : "border-white/10",
					)}
				>
					<label htmlFor="list">
						<CardHeader className={layout === "vertical" ? "p-3" : undefined}>
							<div
								className={clsx(
									"flex gap-3",
									layout === "vertical" ? "items-center" : "flex-col gap-2",
								)}
							>
								{layout === "horizontal" && (
									<CardTitle className="text-white-400 text-[16px] leading-[27.2px] tracking-normal font-sans">
										List
									</CardTitle>
								)}
								<div className="flex items-center">
									<RadioGroupItem
										value="list"
										id="list"
										className="text-blue-500 data-[state=checked]:border-[1.5px] data-[state=checked]:border-blue-500"
									/>
									{layout === "vertical" && (
										<div className="flex flex-col gap-1 ml-3">
											<CardTitle className="text-white-400 text-[14px] font-sans">
												List
											</CardTitle>
											<CardDescription className="text-black-400 font-medium text-[12px] font-geist">
												Simple vertical list
											</CardDescription>
										</div>
									)}
								</div>
								{layout === "horizontal" && (
									<CardDescription className="text-black-400 font-medium text-[12px] leading-[20.4px] font-geist">
										Simple vertical list
									</CardDescription>
								)}
							</div>
						</CardHeader>
					</label>
				</Card>

				<Card
					className={clsx(
						"cursor-pointer border-[1px]",
						viewType === "carousel" ? "border-blue-500" : "border-white/10",
					)}
				>
					<label htmlFor="carousel">
						<CardHeader className={layout === "vertical" ? "p-3" : undefined}>
							<div
								className={clsx(
									"flex gap-3",
									layout === "vertical" ? "items-center" : "flex-col gap-2",
								)}
							>
								{layout === "horizontal" && (
									<CardTitle className="text-white-400 text-[16px] leading-[27.2px] tracking-normal font-sans">
										Carousel
									</CardTitle>
								)}
								<div className="flex items-center">
									<RadioGroupItem
										value="carousel"
										id="carousel"
										className="text-blue-500 data-[state=checked]:border-[1.5px] data-[state=checked]:border-blue-500"
									/>
									{layout === "vertical" && (
										<div className="flex flex-col gap-1 ml-3">
											<CardTitle className="text-white-400 text-[14px] font-sans">
												Carousel
											</CardTitle>
											<CardDescription className="text-black-400 font-medium text-[12px] font-geist">
												Interactive circular layout
											</CardDescription>
										</div>
									)}
								</div>
								{layout === "horizontal" && (
									<CardDescription className="text-black-400 font-medium text-[12px] leading-[20.4px] font-geist">
										Interactive circular layout
									</CardDescription>
								)}
							</div>
						</CardHeader>
					</label>
				</Card>
			</RadioGroup>
		</div>
	);
}
