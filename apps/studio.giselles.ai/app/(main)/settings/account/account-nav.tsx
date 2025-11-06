"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/settings/account", label: "Overview" },
  { href: "/settings/account/general", label: "General" },
  { href: "/settings/account/authentication", label: "Authentication" },
] as const;

export function AccountSettingsNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center px-page py-0">
      <div className="flex items-center space-x-[12px]">
        {LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-label={`${link.label} menu`}
              className={
                "text-[16px] font-sans font-medium transition-colors px-2 py-2 relative rounded-md " +
                (isActive
                  ? "text-accent nav-glow after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-accent"
                  : "text-secondary hover:text-accent hover:after:content-[''] hover:after:absolute hover:after:left-0 hover:after:right-0 hover:after:bottom-0 hover:after:h-[2px] hover:after:bg-accent")
              }
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}


