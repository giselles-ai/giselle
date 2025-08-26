"use client";

import { Button } from "@giselle-internal/ui/button";
import { ChevronRight, ExternalLink, Palette, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";
import { SignOutButton } from "@/services/accounts/components/user-button/sign-out-button";
import { SettingsDialog } from "../(top)/settings-dialog";
import { navigationItems } from "./navigation-rail/navigation-items";
import type { UserDataForNavigationRail } from "./navigation-rail/types";

export function MobileBottomNavigation({
  user: userPromise,
}: {
  user: Promise<UserDataForNavigationRail>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showHelpAccordion, setShowHelpAccordion] = useState(false);
  const [showDisplayDialog, setShowDisplayDialog] = useState(false);
  const isCarouselView = searchParams.get("view") === "carousel";
  const user = use(userPromise);

  const setIsCarouselView = useCallback(
    (value: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("view", "carousel");
      } else {
        params.delete("view");
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-stage-background)] border-t border-white/10 z-20 h-[60px]">
      <div className="flex items-center h-full">
        {/* Left profile icon */}
        <button
          type="button"
          onClick={() => setShowMobileMenu(true)}
          className="flex items-center justify-center flex-1 text-[var(--color-stage-sidebar-text)] hover:text-[var(--color-stage-sidebar-text-hover)] transition-colors"
        >
          <AvatarImage
            className="rounded-full"
            avatarUrl={user.avatarUrl ?? null}
            width={28}
            height={28}
            alt={user.displayName || user.email || "User"}
          />
        </button>

        {/* Showcase */}
        {(() => {
          const showcaseItem = navigationItems.find(
            (item) => item.id === "showcase-link",
          );
          if (!showcaseItem) return null;
          const isActive = showcaseItem.isActive
            ? showcaseItem.isActive(pathname)
            : pathname === showcaseItem.href;
          const Icon = showcaseItem.icon;
          return (
            <Link
              href={showcaseItem.href}
              className={`flex flex-col items-center justify-center px-3 py-2 transition-colors flex-1 ${
                isActive
                  ? "text-[var(--color-stage-sidebar-text-hover)]"
                  : "text-[var(--color-stage-sidebar-text)] hover:text-[var(--color-stage-sidebar-text-hover)]"
              }`}
            >
              <Icon className="size-5 flex-shrink-0" />
            </Link>
          );
        })()}

        {/* New task (center) */}
        {(() => {
          const newTaskItem = navigationItems.find(
            (item) => item.id === "new-task-link",
          );
          if (!newTaskItem) return null;
          const Icon = newTaskItem.icon;
          return (
            <Button
              variant="glass"
              onClick={() => router.push(newTaskItem.href)}
              className="flex flex-col items-center justify-center transition-colors flex-1 max-w-16 mx-auto h-auto [&>div]:flex [&>div]:flex-col [&>div]:items-center [&>div]:justify-center [&[data-size]]:px-4 [&[data-size]]:py-3 [&[data-size]]:rounded-2xl"
            >
              <Icon className="size-5 flex-shrink-0" />
            </Button>
          );
        })()}

        {/* Tasks */}
        {(() => {
          const tasksItem = navigationItems.find(
            (item) => item.id === "tasks-link",
          );
          if (!tasksItem) return null;
          const isActive = tasksItem.isActive
            ? tasksItem.isActive(pathname)
            : pathname === tasksItem.href;
          const Icon = tasksItem.icon;
          return (
            <Link
              href={tasksItem.href}
              className={`flex flex-col items-center justify-center px-3 py-2 transition-colors flex-1 ${
                isActive
                  ? "text-[var(--color-stage-sidebar-text-hover)]"
                  : "text-[var(--color-stage-sidebar-text)] hover:text-[var(--color-stage-sidebar-text-hover)]"
              }`}
            >
              <Icon className="size-5 flex-shrink-0" />
            </Link>
          );
        })()}

        {/* Right palette icon */}
        <button
          type="button"
          onClick={() => setShowDisplayDialog(true)}
          className="flex items-center justify-center flex-1 text-[var(--color-stage-sidebar-text)] hover:text-[var(--color-stage-sidebar-text-hover)] transition-colors"
        >
          <Palette className="size-5" />
        </button>
      </div>

      {/* Mobile Menu Modal */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/20">
          <div className="fixed bottom-[60px] left-4 right-4 bg-[var(--color-stage-background)] border border-white/10 rounded-2xl p-6 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            {/* Header */}
            <div className="flex justify-end mb-6">
              <button
                type="button"
                onClick={() => setShowMobileMenu(false)}
                className="p-2 text-[var(--color-stage-sidebar-text)] hover:text-[var(--color-stage-sidebar-text-hover)] transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="space-y-4">
              <Link
                href="/settings/account"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center justify-between p-3 text-white hover:text-white/80 hover:bg-white/5 rounded-lg transition-colors"
              >
                Account settings
              </Link>

              <button
                type="button"
                onClick={() => setShowHelpAccordion(!showHelpAccordion)}
                className="flex items-center justify-between p-3 text-white hover:text-white/80 hover:bg-white/5 rounded-lg transition-colors w-full text-left"
              >
                Help
                <ChevronRight
                  className={`size-4 transition-transform ${showHelpAccordion ? "rotate-90" : ""}`}
                />
              </button>

              {/* Help Accordion Content */}
              {showHelpAccordion && (
                <div className="ml-4 space-y-2">
                  <a
                    href="https://docs.giselles.ai/guides/introduction"
                    target="_blank"
                    rel="noopener"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center justify-between p-2 text-sm text-white/90 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Docs
                    <ExternalLink className="size-3" />
                  </a>

                  <a
                    href="https://giselles.ai/legal/terms"
                    target="_blank"
                    rel="noopener"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center justify-between p-2 text-sm text-white/90 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Terms
                    <ExternalLink className="size-3" />
                  </a>

                  <a
                    href="https://giselles.ai/legal/privacy"
                    target="_blank"
                    rel="noopener"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center justify-between p-2 text-sm text-white/90 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Privacy & Cookies
                    <ExternalLink className="size-3" />
                  </a>

                  <a
                    href="mailto:support@giselles.ai"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center justify-between p-2 text-sm text-white/90 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Contact Us
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}

              <Link
                href="/apps"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center justify-between p-3 text-white hover:text-white/80 hover:bg-white/5 rounded-lg transition-colors"
              >
                Lobby
              </Link>

              <a
                href="https://giselles.ai"
                target="_blank"
                rel="noopener"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center justify-between p-3 text-white hover:text-white/80 hover:bg-white/5 rounded-lg transition-colors"
              >
                Homepage
                <ExternalLink className="size-4" />
              </a>

              <div className="border-t border-white/10 pt-4">
                <div className="p-3 text-white hover:text-white/80 hover:bg-white/5 rounded-lg transition-colors">
                  <SignOutButton className="text-left w-full text-base">
                    Log out
                  </SignOutButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Display Type Dialog */}
      <SettingsDialog
        isOpen={showDisplayDialog}
        onOpenChange={setShowDisplayDialog}
        isMobile={true}
        isCarouselView={isCarouselView}
        setIsCarouselView={setIsCarouselView}
      />
    </nav>
  );
}
