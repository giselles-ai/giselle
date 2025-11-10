export function TopLightOverlay() {
	return (
		<div className="pointer-events-none absolute left-0 top-0 h-[400px] w-full overflow-hidden z-0">
			<div className="relative h-full w-full bg-gradient-to-b from-[rgba(184,232,244,0.15)] via-[rgba(184,232,244,0.05)] to-transparent blur-[6px] opacity-90 [mask-image:radial-gradient(ellipse_70%_100%_at_50%_0,black_25%,transparent_100%)]">
				<div className="absolute left-1/2 top-0 h-[3px] w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[rgba(184,232,244,0.6)] to-transparent blur-[2px]" />
			</div>
		</div>
	);
}
