"use client";

import clsx from "clsx/lite";
import { Popover as PopoverPrimitive } from "radix-ui";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { GlassSurfaceLayers } from "./glass-surface";

export type ModelPickerGroup = {
	provider: string;
	label?: string;
	models: Array<{
		id: string;
		label?: string;
		icon?: ReactNode;
		badge?: ReactNode;
	}>;
};

export function ModelPicker({
	currentProvider,
	currentModelId,
	groups = [],
	onSelect,
	width = 320,
	searchPlaceholder = "Search model...",
}: {
	currentProvider: string;
	currentModelId: string;
	groups?: ModelPickerGroup[];
	onSelect: (provider: string, modelId: string) => void;
	width?: number;
	searchPlaceholder?: string;
}) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [providerFilter, setProviderFilter] = useState<string | "all">(
		currentProvider || "all",
	);

	const filteredGroups = useMemo(() => {
		const safeGroups = Array.isArray(groups) ? groups : [];
		const lowerQ = query.trim().toLowerCase();
		const base =
			providerFilter === "all"
				? safeGroups
				: safeGroups.filter((g) => g.provider === providerFilter);
		return base.map((g) => ({
			...g,
			models: lowerQ
				? (g.models ?? []).filter((m) =>
						(m.label || m.id).toLowerCase().includes(lowerQ),
					)
				: (g.models ?? []),
		}));
	}, [groups, providerFilter, query]);

	const triggerLabel = `${currentProvider} · ${currentModelId}`;

	return (
		<PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
			<PopoverPrimitive.Trigger asChild>
				<button
					type="button"
					className={clsx(
						"w-full flex justify-between items-center rounded-[8px] h-10 px-[12px] text-left text-[14px] shrink-0",
						"outline-none focus:outline-none focus-visible:outline-none focus:ring-0",
						"bg-inverse/5 transition-colors hover:bg-inverse/10",
						"data-[placeholder]:text-text-muted",
					)}
				>
					<span className="min-w-0 text-ellipsis overflow-hidden whitespace-nowrap">
						{triggerLabel}
					</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="size-[13px] shrink-0 text-text ml-2"
						role="img"
						aria-label="Open"
					>
						<path d="m6 9 6 6 6-6" />
					</svg>
				</button>
			</PopoverPrimitive.Trigger>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Content
					sideOffset={6}
					align="end"
					className={clsx(
						"relative rounded-[8px] px-[8px] py-[8px] text-inverse overflow-hidden z-50",
					)}
					style={{ width }}
				>
					<GlassSurfaceLayers
						radiusClass="rounded-[8px]"
						borderStyle="solid"
						withTopHighlight
						withBaseFill
					/>
					<div className="relative flex flex-col gap-[8px] max-h-[320px] overflow-y-auto">
						<div className="flex h-[28px] p-[8px] items-center gap-[8px] self-stretch rounded-[8px] bg-white/10 mx-[4px] mb-[4px]">
							<div className="text-black-400">
								<svg
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									role="img"
									aria-label="Search"
								>
									<path
										d="M21 21L15.5 15.5M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</div>
							<input
								placeholder={searchPlaceholder}
								className="w-full bg-transparent border-none text-inverse text-[12px] placeholder:text-black-400 focus:outline-none"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
							/>
						</div>

						<div className="mx-[4px] mb-[6px]">
							<div className="flex items-center rounded-md gap-2">
								{["all", ...groups.map((g) => g.provider)]
									.filter((v, i, arr) => arr.indexOf(v) === i)
									.map((p) => (
										<button
											key={p}
											type="button"
											onClick={() => setProviderFilter(p)}
											className={clsx(
												"flex px-[8px] py-0 justify-center items-center rounded text-[12px] font-medium",
												providerFilter === p
													? "bg-[#505D7B] text-[#DEE9F2]"
													: "hover:bg-[#3A425A] text-[#DEE9F2]",
											)}
										>
											{p === "all" ? "All" : p}
										</button>
									))}
							</div>
						</div>

						<div className="mt-[0px] mx-[4px] pr-[4px]">
							<div className="flex flex-col gap-[6px] max-h-[220px] overflow-y-auto">
								{filteredGroups.map((group) => (
									<div key={group.provider} className="flex flex-col gap-[4px]">
										{group.label ? (
											<div className="text-[11px] text-black-400 px-[4px]">
												{group.label}
											</div>
										) : null}
										{group.models.map((m) => (
											<button
												key={`${group.provider}-${m.id}`}
												type="button"
												onClick={() => {
													onSelect(group.provider, m.id);
													setOpen(false);
												}}
												className="flex gap-[12px] items-center p-[4px] rounded-[4px] hover:bg-white/5 focus:bg-white/5 cursor-pointer text-left"
											>
												<div className="flex items-center">
													{m.icon ? (
														<span className="w-[18px] h-[18px] inline-flex items-center justify-center">
															{m.icon}
														</span>
													) : (
														<span
															className="w-[18px] h-[18px] rounded-sm bg-white/20"
															aria-hidden
														/>
													)}
												</div>
												<div className="flex items-center gap-[8px]">
													<p className="text-[14px] text-left text-nowrap">
														{m.label || m.id}
													</p>
													{m.badge}
												</div>
											</button>
										))}
									</div>
								))}
							</div>
						</div>
					</div>
				</PopoverPrimitive.Content>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
}
