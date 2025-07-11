import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";

const cardVariants = cva(
	"rounded-xl border bg-card text-card-foreground shadow-sm",
	{
		variants: {
			variant: {
				default: "rounded-xl border bg-card text-card-foreground shadow-sm",
				glass:
					"relative rounded-[12px] overflow-hidden px-[24px] pt-[16px] pb-[24px] w-full gap-[16px] grid bg-white/[0.02] backdrop-blur-[8px] border-[0.5px] border-white/8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.2)] before:content-[''] before:absolute before:inset-0 before:bg-white before:opacity-[0.02] before:rounded-[inherit] before:pointer-events-none",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

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

interface CardProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof cardVariants> {
	title?: string;
	description?: string;
	action?: Action;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
	(
		{ className, variant, title, description, action, children, ...props },
		ref,
	) => (
		<div
			ref={ref}
			className={cn(cardVariants({ variant, className }))}
			{...props}
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
									<button
										type="submit"
										className="relative inline-flex items-center justify-center rounded-lg border-t border-b border-t-white/20 border-b-black/20 px-6 py-2 text-sm font-medium text-white bg-[rgba(60,90,160,0.15)] border border-white/10 shadow-[inset_0_0_12px_rgba(255,255,255,0.04)] hover:shadow-[inset_0_0_16px_rgba(255,255,255,0.06)] transition-all duration-300"
									>
										{action.content}
									</button>
								</form>
							)}
							{action.href != null && (
								<Link
									href={action.href}
									className="relative inline-flex items-center justify-center rounded-lg border-t border-b border-t-white/20 border-b-black/20 px-6 py-2 text-sm font-medium text-white bg-[rgba(60,90,160,0.15)] border border-white/10 shadow-[inset_0_0_12px_rgba(255,255,255,0.04)] hover:shadow-[inset_0_0_16px_rgba(255,255,255,0.06)] transition-all duration-300"
								>
									{action.content}
								</Link>
							)}
							{action.component != null && action.component}
						</div>
					)}
				</div>
			)}
			{children}
		</div>
	),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex flex-col space-y-1.5 p-6", className)}
		{...props}
	/>
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
	<h3
		ref={ref}
		className={cn("font-semibold leading-none tracking-tight", className)}
		{...props}
	/>
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<p
		ref={ref}
		className={cn("text-sm text-muted-foreground", className)}
		{...props}
	/>
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("flex items-center p-6 pt-0", className)}
		{...props}
	/>
));
CardFooter.displayName = "CardFooter";

export {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardDescription,
	CardContent,
};
