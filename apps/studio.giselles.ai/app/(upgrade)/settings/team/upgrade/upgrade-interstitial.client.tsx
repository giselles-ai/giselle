"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GlassButton } from "@/components/ui/glass-button";
import { CircleIcon } from "./plan-icon";
import { PricingCard } from "./pricing-card";

export function UpgradeInterstitial() {
	const tabs = useMemo(
		() => [
			{ id: "personal", label: "Personal" },
			{ id: "business", label: "Business" },
		],
		[],
	);
	const [tabId, setTabId] = useState(tabs[0]?.id ?? "personal");

	return (
		<div className="w-full">
			<div>
				<div className="relative flex items-center px-1 py-1">
					<Link
						href="/settings/team"
						aria-label="Back to Team Settings"
						className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white transition-colors"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 20 20"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true"
						>
							<path
								d="M12.5 4.5L7 10l5.5 5.5"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</Link>

					<h1
						className="absolute left-1/2 -translate-x-1/2 text-center text-[30px] font-sans font-medium text-[hsl(192,73%,84%)]"
						style={{
							textShadow:
								"rgb(0, 135, 246) 0px 0px 20px, rgb(0, 135, 246) 0px 0px 40px, rgb(0, 135, 246) 0px 0px 60px",
						}}
					>
						Plans that scale with you
					</h1>
				</div>

				<div className="mt-6 flex justify-center">
					<Tabs options={tabs} value={tabId} onChange={setTabId} />
				</div>

				{tabId === "personal" ? (
					<div className="mt-10 flex justify-center">
						<div className="inline-grid flex-col gap-y-[23px] sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-6">
							<section className="flex justify-center">
								<PricingCard
									icon={<CircleIcon variant="free" />}
									title="Free"
									subtitle="Perfect for solo developers exploring AI agents"
									price={{ amount: "Free", cadence: "" }}
									isCurrentPlan
									cta={
										<div className="px-1 pt-3 pb-3">
											<GlassButton
												type="button"
												variant="currentPlan"
												disableHoverFill
												aria-disabled="true"
												tabIndex={-1}
												className="w-full whitespace-nowrap pointer-events-none"
												aria-label="Current plan"
											>
												Current plan
											</GlassButton>
										</div>
									}
									features={[
										"30 minutes of AI model usage",
										"Access to basic AI models",
										"Managed cloud deployment",
										"Single user account",
									]}
								/>
							</section>

							<section className="flex justify-center">
								<PricingCard
									icon={<CircleIcon variant="pro" />}
									title="Pro"
									subtitle="Built for professional developers"
									price={{ amount: "$20", cadence: "/month" }}
									cta={
										<div className="px-1 pt-3 pb-3">
											<GlassButton
												type="button"
												disableHoverFill
												className="w-full whitespace-nowrap"
												aria-label="Get Started"
											>
												Get Started
											</GlassButton>
										</div>
									}
									features={[
										"All Free features included",
										"$20 of AI credits included each month",
										"Access to all premium AI models",
										"Document & GitHub Vector Stores",
										"Single user account",
										"Email support",
									]}
								/>
							</section>

							<section className="flex justify-center">
								<PricingCard
									icon={<CircleIcon variant="team" />}
									title="Team"
									subtitle="Perfect for teams collaborating on AI agents"
									price={{ amount: "$100", cadence: "/month" }}
									cta={
										<div className="px-1 pt-3 pb-3">
											<GlassButton
												type="button"
												variant="comingSoon"
												disableHoverFill
												aria-disabled="true"
												tabIndex={-1}
												className="w-full whitespace-nowrap pointer-events-none"
												aria-label="Coming Soon"
											>
												Coming Soon
											</GlassButton>
										</div>
									}
									features={[
										"All Pro features included",
										"Team collaboration and sharing",
										"Up to 10 users",
										"Priority email support",
									]}
								/>
							</section>
						</div>
					</div>
				) : (
					<div className="mt-10 flex justify-center">
						<div className="inline-grid flex-col gap-y-[23px] sm:grid sm:grid-cols-2 sm:gap-4 lg:gap-6">
							<section className="flex justify-center">
								<PricingCard
									icon={<CircleIcon variant="team" />}
									title="Team"
									subtitle="Perfect for teams collaborating on AI agents"
									price={{ amount: "$100", cadence: "/month" }}
									cta={
										<div className="px-1 pt-3 pb-3">
											<GlassButton
												type="button"
												variant="comingSoon"
												disableHoverFill
												aria-disabled="true"
												tabIndex={-1}
												className="w-full whitespace-nowrap pointer-events-none"
												aria-label="Coming Soon"
											>
												Coming Soon
											</GlassButton>
										</div>
									}
									features={[
										"All Pro features included",
										"Team collaboration and sharing",
										"Up to 10 users",
										"Priority email support",
									]}
								/>
							</section>

							<section className="flex justify-center">
								<PricingCard
									icon={<CircleIcon variant="enterprise" />}
									title="Enterprise"
									subtitle="Security, compliance, and support for large teams"
									price={{ amount: "Contact", cadence: "" }}
									cta={
										<div className="px-1 pt-3 pb-3">
											<GlassButton
												type="button"
												variant="comingSoon"
												disableHoverFill
												aria-disabled="true"
												tabIndex={-1}
												className="w-full whitespace-nowrap pointer-events-none"
												aria-label="Coming Soon"
											>
												Coming Soon
											</GlassButton>
										</div>
									}
									features={[
										"Advanced security controls",
										"Audit logs",
										"Dedicated support",
									]}
								/>
							</section>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function Tabs({
	options,
	value,
	onChange,
}: {
	options: { id: string; label: string }[];
	value: string;
	onChange: (id: string) => void;
}) {
	return (
		<div className="inline-flex items-center rounded-full bg-white/10 p-1">
			{options.map((option) => {
				const isActive = option.id === value;
				return (
					<button
						key={option.id}
						type="button"
						onClick={() => onChange(option.id)}
						className={[
							"rounded-full px-5 py-2 text-[13px] font-semibold transition-colors",
							isActive
								? "bg-white/90 text-black shadow-sm"
								: "text-white/70 hover:text-white",
						].join(" ")}
					>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}
