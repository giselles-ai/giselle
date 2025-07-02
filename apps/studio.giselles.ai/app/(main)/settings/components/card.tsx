import Link from "next/link";
import type { FC, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

type SubmitAction = {
	href?: never;
	component?: never;
	content: string;
	onAction: () => void;
};
type LinkAction = {
	onAction?: never;
	component?: never;
	content: string;
	href: string;
};
type CustomComponentAction = {
	component: React.ReactNode;
	onAction?: never;
	href?: never;
};
type Action = SubmitAction | LinkAction | CustomComponentAction;
type CardProps = {
	title?: string;
	description?: string;
	action?: Action;
	className?: string;
};
export const Card: FC<PropsWithChildren<CardProps>> = ({
	title,
	description,
	action,
	children,
	className,
}) => (
	<div
		className={cn(
			"relative rounded-[12px] overflow-hidden px-[24px] pt-[16px] pb-[24px] w-full gap-[16px] grid bg-white/[0.02] backdrop-blur-[8px] border-[0.5px] border-white/8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.2)] before:content-[''] before:absolute before:inset-0 before:bg-white before:opacity-[0.02] before:rounded-[inherit] before:pointer-events-none",
			className,
		)}
	>
		{(title || description || action) && (
			<div className="flex justify-between gap-x-2.5">
				<div className="grid gap-[3px] font-medium">
					{title && (
						<h2 className="text-white-400 text-[16px] leading-[27.2px] tracking-normal font-sans">
							{title}
						</h2>
					)}
					{description && (
						<p className="text-black-400 text-[12px] leading-[20.4px] tracking-normal font-geist">
							{description}
						</p>
					)}
				</div>
				{action && (
					<div>
						{action.onAction != null && (
							<form action={action.onAction}>
								<Button type="submit">{action.content}</Button>
							</form>
						)}
						{action.href != null && (
							<Button asChild>
								<Link href={action.href}>{action.content}</Link>
							</Button>
						)}
						{action.component != null && action.component}
					</div>
				)}
			</div>
		)}
		{children}
	</div>
);
