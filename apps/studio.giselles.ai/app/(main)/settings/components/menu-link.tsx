"use client";

import { type VariantProps, cva } from "class-variance-authority";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FC, PropsWithChildren, ReactNode } from "react";

const menuLinkVariant = cva(
	"flex items-center rounded-[8px] px-[16px] h-[32px] gap-[16px] font-rosart text-black-30 ",
	{
		variants: {
			variant: {
				active: "bg-black-70",
				inactive: "bg-transparent",
			},
		},
	},
);
type MenuItemProps = {
	icon: ReactNode;
	href: string;
};

export const MenuLink: FC<PropsWithChildren<MenuItemProps>> = ({
	icon,
	children,
	href,
}) => {
	const pathname = usePathname();
	const variant = pathname === href ? "active" : "inactive";
	return (
		<Link href={href} className={menuLinkVariant({ variant })}>
			{icon}
			<span>{children}</span>
		</Link>
	);
};
