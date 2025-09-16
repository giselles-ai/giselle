"use client";

import { Button } from "@giselle-internal/ui/button";
import { Play, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";
import { RunModal } from "./components/run-modal";
import AppIcon from "../components/app-icon";

interface AppDetails {
  id: string;
  name: string;
  description: string;
  owner: string;
  updatedAt: string;
  status: string;
  runTime: string;
  requests: string;
  executionCount: number;
  totalOutput: string;
  tokens: string;
  llm: string;
  isFavorite: boolean;
  favoriteCount: number;
  teamId: string;
  workspaceId: string;
  creator: {
    name: string;
    avatarUrl?: string;
  };
  previewCard: {
    title: string;
    creator: string;
    stats: {
      likes: string;
      views: string;
    };
  };
  executionHistory: Array<{
    id: string;
    status: string;
    createdAt: Date;
    duration: string;
  }>;
}

interface AppDetailClientProps {
  appDetails: AppDetails;
}

export function AppDetailClient({ appDetails }: AppDetailClientProps) {
  const [isFavorite, setIsFavorite] = useState(appDetails.isFavorite);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Add API call to update favorite status
  };

  const handleRunClick = () => {
    setIsRunModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[var(--color-stage-background)] text-white">
      <div className="flex flex-col h-full">
        {/* Breadcrumb */}
        <div className="p-6 pb-0">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-6">
            <Link
              href="/stage/showcase"
              className="hover:text-white/80 transition-colors"
            >
              Showcase
            </Link>
            <span>&lt;</span>
            <span>{appDetails.name}</span>
          </div>
        </div>

        {/* Main Content - Responsive Layout */}
        <div className="flex flex-col lg:flex-row p-4 lg:p-6 gap-4 lg:gap-6">
          {/* App Thumbnail */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <div
              className="relative flex h-48 lg:h-60 w-full rounded-[12px] border-[0.5px] bg-[linear-gradient(135deg,rgba(100,130,200,0.20)_0%,rgba(60,80,120,0.35)_40%,rgba(20,30,60,0.85)_100%)]"
              style={
                {
                  "--spotlight-color": "rgba(255,255,255,0.15)",
                  borderColor: "rgba(160,180,255,0.15)",
                } as React.CSSProperties
              }
            >
              {/* Top reflection line */}
              <div className="pointer-events-none absolute top-0 left-4 right-4 z-10 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

              {/* Subtle inner border */}
              <div className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] border-[0.5px] border-white/5" />

              <div className="relative z-10 flex h-full w-full flex-col items-center justify-center text-white/80">
                <div className="w-full h-full bg-white/5 rounded-lg flex items-center justify-center">
                  <AppIcon
                    className="h-12 w-12 text-white/30"
                    aria-label="App icon"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* App Details */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* App Title */}
              <h1 className="text-3xl font-bold mb-3">{appDetails.name}</h1>

              {/* Creator Info */}
              <div className="flex items-center gap-2 mb-4">
                {appDetails.creator.avatarUrl ? (
                  <AvatarImage
                    avatarUrl={appDetails.creator.avatarUrl}
                    width={24}
                    height={24}
                    alt={appDetails.creator.name}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-xs text-white/60">
                      {appDetails.creator.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm text-white/70">
                  {appDetails.creator.name}
                </span>
              </div>

              {/* Description */}
              <p className="text-white/70 text-sm leading-relaxed">
                {appDetails.description}
              </p>
            </div>

            {/* Stats and Action Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
              {/* Left: Stats */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 text-sm text-white/80">
                  <Play className="h-4 w-4" fill="currentColor" />
                  <span>{appDetails.executionCount}</span>
                </div>
                <button
                  type="button"
                  onClick={toggleFavorite}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-colors ${
                    isFavorite
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-white/10 text-white/80 hover:bg-white/20"
                  }`}
                >
                  <Star
                    className={`h-4 w-4 transition-all ${isFavorite ? "fill-current" : "group-hover:fill-current"}`}
                  />
                  <span>{appDetails.favoriteCount}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link
                  href={
                    appDetails.id
                      ? `/workspaces/${appDetails.id}`
                      : "/playground"
                  }
                  className="rounded-lg px-3 py-2 text-white/80 transition-all duration-200 active:scale-[0.98] text-sm flex-1 sm:flex-none text-center"
                  style={{
                    background:
                      "linear-gradient(180deg, #202530 0%, #12151f 100%)",
                    border: "1px solid rgba(0,0,0,0.7)",
                    boxShadow:
                      "inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 8px rgba(5,10,20,0.4), 0 1px 2px rgba(0,0,0,0.3)",
                  }}
                >
                  Edit
                </Link>
                <Button
                  variant="glass"
                  onClick={handleRunClick}
                  className="flex-1 sm:flex-none justify-center"
                >
                  <Play className="h-3 w-3" />
                  Run
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Details Section */}
        <div className="px-4 lg:px-6 pb-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - App History */}
            <div className="flex-1 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">
                My Execution History
              </h3>
              <div className="space-y-3">
                {appDetails.executionHistory.length > 0 ? (
                  appDetails.executionHistory.map((execution) => (
                    <div
                      key={execution.id}
                      className="flex items-center justify-between py-2 border-b border-white/10 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            execution.status === "success"
                              ? "bg-green-400"
                              : "bg-red-400"
                          }`}
                        ></div>
                        <div>
                          <div className="text-sm text-white">
                            {execution.status === "success"
                              ? "Successful execution"
                              : "Failed execution"}
                          </div>
                          <div className="text-xs text-white/60">
                            {new Intl.RelativeTimeFormat("en", {
                              numeric: "auto",
                            }).format(
                              Math.floor(
                                (execution.createdAt.getTime() - Date.now()) /
                                  (1000 * 60 * 60 * 24),
                              ),
                              "day",
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-white/60">
                        {execution.duration}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-white/60 text-center py-4">
                    No execution history found
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="w-full lg:w-px h-px lg:h-auto bg-white/10"></div>

            {/* Right Column - App Details */}
            <div className="flex-1 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">
                App Details
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Team</span>
                  <span className="text-white text-sm">{appDetails.owner}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Owner</span>
                  <span className="text-white text-sm">
                    {appDetails.creator.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Updated</span>
                  <span className="text-white text-sm">
                    {appDetails.updatedAt}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Status</span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        appDetails.status === "Active"
                          ? "bg-green-400"
                          : "bg-gray-400"
                      }`}
                    ></div>
                    <span className="text-white text-sm">
                      {appDetails.status}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">LLM</span>
                  <span className="text-white text-sm">{appDetails.llm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Runtime</span>
                  <span className="text-white text-sm">
                    {appDetails.runTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Requests</span>
                  <span className="text-white text-sm">
                    {appDetails.requests}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Total output</span>
                  <span className="text-white text-sm">
                    {appDetails.totalOutput}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">Tokens</span>
                  <span className="text-white text-sm">
                    {appDetails.tokens}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RunModal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        appName={appDetails.name}
        workspaceId={appDetails.workspaceId}
        teamId={appDetails.teamId}
      />
    </div>
  );
}
