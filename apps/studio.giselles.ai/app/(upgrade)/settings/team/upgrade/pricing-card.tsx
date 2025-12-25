import { GlassCard } from "@giselle-internal/ui/glass-card";
import type { ReactNode } from "react";

export function PricingCard({
	icon,
	title,
	subtitle,
	price,
	cta,
	features,
	isCurrentPlan = false,
}: {
	icon: ReactNode;
	title: string;
	subtitle: string;
	price: { amount: string; cadence: string };
	cta: ReactNode;
	features: string[];
	isCurrentPlan?: boolean;
}) {
	const cardClassName = [
		"relative flex flex-col overflow-hidden rounded-[20px] border border-white/10 pb-6 transition-all duration-300 w-full max-w-[330px] backdrop-blur-[40px] bg-white/5 shadow-[0_8px_32px_0_rgba(31,38,135,0.37),inset_0_1px_0_rgba(255,255,255,0.15)] before:content-[''] before:absolute before:inset-0 before:rounded-[20px] before:border before:border-white/15 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none h-[550px] sm:h-[600px] lg:h-[625px]",
		isCurrentPlan ? "ring-1 ring-[#1663F3]/25" : "",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<GlassCard className={cardClassName}>
			{isCurrentPlan && (
				<>
					<div
						className="pointer-events-none absolute inset-x-0 -top-14 h-44 blur-2xl"
						style={{
							background:
								"radial-gradient(ellipse 70% 65% at 50% 0%, rgba(15,82,186,0.38) 0%, rgba(15,82,186,0.18) 35%, rgba(15,82,186,0) 70%)",
						}}
					/>
					<div
						className="pointer-events-none absolute inset-x-0 top-0 h-32"
						style={{
							background:
								"radial-gradient(ellipse 75% 60% at 50% 0%, rgba(15,82,186,0.24) 0%, rgba(15,82,186,0.11) 40%, rgba(15,82,186,0) 75%)",
						}}
					/>
				</>
			)}

			<div className="absolute top-0 left-0 right-0 h-[34px]" />

			<div className="relative z-10 flex flex-col gap-y-1 px-6 lg:px-8 rounded-t-2xl pt-[50px] min-h-[140px]">
				<div className="flex flex-col items-start gap-y-2">
					{icon}
					<h2 className="font-sans font-medium text-white-100 text-lg sm:text-xl lg:text-2xl leading-[24px] sm:leading-[28px] lg:leading-[33.6px] tracking-[-0.06em]">
						{title}
					</h2>
					<p className="font-sans leading-[16.8px] text-white-400 font-normal text-xs sm:text-sm tracking-[-0.011em] h-[40px] flex items-start">
						{subtitle}
					</p>
				</div>
			</div>

			<div className="relative z-10 flex flex-col px-6 lg:px-8 flex-1">
				<div className="flex items-baseline gap-1 lg:gap-2 mb-4 flex-wrap">
					<span className="font-sans text-[32px] sm:text-[36px] lg:text-[40px] font-normal leading-[38px] sm:leading-[43px] lg:leading-[48px] tracking-[-0.011em] text-white-100">
						{price.amount}
					</span>
					{price.cadence && (
						<span className="font-sans text-xs sm:text-sm lg:text-base leading-[16px] sm:leading-[20px] lg:leading-[22.4px] tracking-[-0.011em] text-white-400">
							{price.cadence}
						</span>
					)}
				</div>

				<div className="w-full mb-6">{cta}</div>

				<div className="flex flex-col flex-1">
					<div className="flex flex-col gap-y-3 sm:gap-y-4">
						<h3 className="font-sans font-normal text-xs sm:text-sm italic leading-[16px] sm:leading-[19.6px] tracking-[-0.011em] text-white-400">
							Key Features:
						</h3>
						<ul className="flex flex-col gap-y-2.5 sm:gap-y-3.5">
							{features.map((feature) => (
								<li
									key={feature}
									className="flex items-start gap-x-2 sm:gap-x-3 text-white-100 font-sans font-normal text-xs sm:text-sm leading-3 sm:leading-4"
								>
									<span className="text-blue-new mt-0.5 flex-shrink-0">
										<CircleCheckIcon />
									</span>
									<span className="flex-1">{feature}</span>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</GlassCard>
	);
}

function CircleCheckIcon() {
	return (
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<title>Circle Check</title>
			<path
				d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"
				fill="currentColor"
			/>
		</svg>
	);
}
