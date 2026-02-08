import type { ReactNode } from "react";

export default function TeamUpgradeStandaloneLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<div className="min-h-screen bg-bg text-white">
			<div className="mx-auto w-full max-w-[1200px] px-6 py-10 md:px-10 md:py-14">
				{children}
			</div>
		</div>
	);
}
