"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@giselle-internal/ui/dialog";
import { ChevronRightIcon } from "lucide-react";
import { createContext, type ReactNode, useContext, useState } from "react";

// Notification data
const NOTIFICATIONS = [
  {
    id: "web-search-integration",
    type: "NEW" as const,
    title: "Enhanced Anthropic Web Search Integration",
    date: "Dec 15, 2024",
    description:
      'We\'ve added improved web search configuration with a streamlined UI and better tool management. Now with consistent "Configure" buttons across all tool providers.',
  },
  {
    id: "zustand-state-management",
    type: "NEW" as const,
    title: "Zustand State Management",
    date: "Dec 12, 2024",
    description:
      "We've started rolling out better state management with ZustandBridgeProvider to keep you up to date with more reliable workspace initialization.",
  },
  {
    id: "ui-consistency-updates",
    type: "IMPROVED" as const,
    title: "UI/UX Consistency Updates",
    date: "Dec 10, 2024",
    description:
      "Ever wanted consistent button styles and hover effects? We've improved icon usage across the entire workspace designer interface.",
  },
];

// Custom Megaphone icon from Lucide v0.15.31
function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <title>Megaphone icon</title>
      <path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
      <path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14" />
      <path d="M8 6v8" />
    </svg>
  );
}

// Global state management for update notifications
interface UpdateNotificationState {
  hasUnreadUpdates: boolean;
  isOpen: boolean;
  setHasUnreadUpdates: (value: boolean) => void;
  setIsOpen: (value: boolean) => void;
  markAsRead: () => void;
}

const UpdateNotificationContext = createContext<UpdateNotificationState | null>(
  null,
);

export function UpdateNotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [hasUnreadUpdates, setHasUnreadUpdates] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const markAsRead = () => {
    setHasUnreadUpdates(false);
    setIsOpen(true);
  };

  return (
    <UpdateNotificationContext.Provider
      value={{
        hasUnreadUpdates,
        isOpen,
        setHasUnreadUpdates,
        setIsOpen,
        markAsRead,
      }}
    >
      {children}
    </UpdateNotificationContext.Provider>
  );
}

export function UpdateNotificationButton() {
  const context = useContext(UpdateNotificationContext);
  if (!context) {
    throw new Error(
      "UpdateNotificationButton must be used within UpdateNotificationProvider",
    );
  }
  const { hasUnreadUpdates, isOpen, setIsOpen, markAsRead } = context;

  const handleClick = () => {
    console.log("Update notification clicked!");
    markAsRead();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          className="relative"
          aria-label="View updates"
        >
          <MegaphoneIcon className="size-4 text-text-muted" />
          {/* Notification dot - only show when there are unread updates */}
          {hasUnreadUpdates && (
            <div className="absolute -top-[2px] -right-[2px] w-[8px] h-[8px] bg-[#6B8FF0] rounded-full" />
          )}
        </button>
      </DialogTrigger>
      <DialogContent>
        <div className="-m-3">
          {/* Header */}
          <div className="mb-[24px] text-center border-b border-white/10 pb-[16px]">
            <DialogTitle className="text-[20px] font-semibold text-[#F7F9FD]">
              Latest Updates
            </DialogTitle>
          </div>

          {/* Content */}
          <div className="space-y-[24px] px-[8px]">
            {NOTIFICATIONS.map((notification, index) => (
              <button
                key={notification.id}
                type="button"
                onClick={() =>
                  console.log(`Navigate to ${notification.title} details`)
                }
                className={`w-full text-left hover:bg-white/5 px-[8px] py-[8px] transition-colors group cursor-pointer ${
                  index < NOTIFICATIONS.length - 1
                    ? "border-b border-white/10 pb-[20px] mb-[16px]"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-[8px] mb-[8px]">
                      <span
                        className={`text-[12px] font-semibold px-[8px] py-[2px] rounded-[4px] ${
                          notification.type === "NEW"
                            ? "bg-[#DAFF09] text-[#00020B]"
                            : "bg-[#08F4EE] text-[#00020B]"
                        }`}
                      >
                        {notification.type}
                      </span>
                      <h3 className="text-[16px] font-semibold text-[#F7F9FD] leading-tight">
                        {notification.title}
                      </h3>
                      <p className="text-[12px] text-white/50 mt-[2px]">
                        {notification.date}
                      </p>
                    </div>
                    <p className="text-[14px] text-white/70 leading-[1.5]">
                      {notification.description}
                    </p>
                  </div>
                  <ChevronRightIcon className="w-[16px] h-[16px] text-white/40 group-hover:text-white/70 transition-colors ml-[12px] shrink-0" />
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="pt-[16px] text-center">
            <a
              href="https://giselles.ai/blog/category/updates/page/1"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="text-[14px] text-[#F7F9FD] hover:text-white underline transition-colors cursor-pointer"
            >
              View all
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
