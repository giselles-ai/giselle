"use client";

import type { ReactNode } from "react";

interface PageHeaderProps {
	title: string;
	subtitle?: ReactNode;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
	return (
		<div>
			<h1
				className="text-[30px] font-sans font-medium text-[hsl(192,73%,84%)] mb-2"
				style={{
					textShadow: "0 0 20px #0087f6, 0 0 40px #0087f6, 0 0 60px #0087f6",
				}}
			>
				{title}
			</h1>
			{subtitle ? <p className="text-sm text-text-muted">{subtitle}</p> : null}
		</div>
	);
}
