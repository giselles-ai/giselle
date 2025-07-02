"use client";

import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FC, PropsWithChildren, ReactNode } from "react";

const menuLinkVariant = cva(
	"flex items-center p-2 gap-[16px] rounded-[4px] font-sans text-white-400 text-[14px] leading-[19.6px]",
	{
		variants: {
			variant: {
				active: "font-bold underline cursor-auto",
				inactive:
					"font-medium hover:bg-white-850/20 hover:shadow-[0px_0px_4px_0px_hsla(0,_0%,_100%,_0.2)_inset]",
			},
		},
	},
);
type MenuItemProps = {
	icon?: ReactNode;
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
