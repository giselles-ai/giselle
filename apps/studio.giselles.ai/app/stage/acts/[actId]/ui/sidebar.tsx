"use client";

import { StatusBadge } from "@giselle-internal/ui/status-badge";
import { NodeIcon } from "@giselle-internal/workflow-designer-ui";
import type { ManualTriggerParameter } from "@giselle-sdk/data-type";
import type { Generation } from "@giselle-sdk/giselle";
import {
  type Act,
  ActStreamReader,
  type StreamDataEventHandler,
} from "@giselle-sdk/giselle/react";
import {
  BrainCircuit,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  CircleDashedIcon,
  CircleSlashIcon,
  RefreshCw,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { GenerationView } from "../../../../../../../internal-packages/workflow-designer-ui/src/ui/generation-view";
import { fetchGenerationData } from "../actions";
import {
  formatExecutionDate,
  getModelInfo,
  getStatusBadgeStatus,
} from "../lib/utils";
import { MobileActions } from "./mobile-actions";
import { AppIcon } from "../../../ui/app-icon";

export interface SidebarDataObject {
  act: Act;
  appName: string;
  teamName: string;
  triggerParameters: ManualTriggerParameter[];
}

export function Sidebar({ data }: { data: Promise<SidebarDataObject> }) {
  const { act: defaultAct, appName, teamName, triggerParameters } = use(data);
  const [act, setAct] = useState(defaultAct);
  const [stepGenerations, setStepGenerations] = useState<
    Record<string, Generation>
  >({});
  const [hasMounted, setHasMounted] = useState(false);
  const [isInputsExpanded, setIsInputsExpanded] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const updateAct = useCallback<StreamDataEventHandler>((data) => {
    setAct(data.act);
  }, []);

  // Fetch generation data for completed steps and trigger step
  useEffect(() => {
    let cancelled = false;
    const fetchGenerations = async () => {
      const generationsToFetch: Array<{
        stepId: string;
        generationId: string;
      }> = [];

      // Collect all completed steps that need generation data, including trigger step
      act.sequences.forEach((sequence) => {
        sequence.steps.forEach((step) => {
          if (step.status === "completed") {
            generationsToFetch.push({
              stepId: step.id,
              generationId: step.generationId,
            });
          }
        });
      });

      // Batch fetch all generations in parallel
      const results = await Promise.all(
        generationsToFetch.map(async ({ stepId, generationId }) => {
          try {
            const generation = await fetchGenerationData(generationId);
            return generation ? { stepId, generation } : null;
          } catch (error) {
            console.warn(
              `Failed to fetch generation for step ${stepId}:`,
              error,
            );
            return null;
          }
        }),
      );

      if (!cancelled) {
        setStepGenerations((prev) => {
          const next = { ...prev };
          for (const result of results) {
            if (result && !prev[result.stepId]) {
              next[result.stepId] = result.generation;
            }
          }
          return next;
        });
      }
    };

    fetchGenerations();
    return () => {
      cancelled = true;
    };
  }, [act]);

  // Track when component has mounted to prevent hydration mismatch
  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <ActStreamReader actId={defaultAct.id} onUpdateAction={updateAct}>
      <aside className="w-full md:flex md:flex-col md:w-[320px] border-0 md:border-[2px] md:border-transparent m-0 md:my-[8px] pb-20 md:pb-0">
        {/* Large Back Arrow */}
        <div className="pt-[16px] mb-[20px] px-[16px] md:px-[32px]">
          <Link
            href="/stage/acts"
            className="flex items-center gap-[8px] text-white-900 hover:text-white-700 transition-colors group"
          >
            <ChevronLeftIcon className="size-[24px] group-hover:-translate-x-1 transition-transform" />
            <span className="text-[16px] font-medium">Back to Acts</span>
          </Link>
        </div>

        {/* App Info Section */}
        <div className="space-y-[16px] px-[16px] md:px-[32px] text-center md:text-left mt-[20px]">
          {/* App Thumbnail */}
          <div className="w-[96px] h-[96px] rounded-[16px] bg-ghost-element flex items-center justify-center flex-shrink-0 mx-auto md:mx-0">
            <AppIcon className="h-[48px] w-[48px] text-text-muted" />
          </div>

          {/* App Name */}
          <div>
            <h1 className="text-[24px] font-semibold text-text mb-[4px]">
              {appName}
            </h1>
            <p className="text-[14px] text-text-muted">{teamName}</p>
          </div>

          {/* Execution Time */}
          <div className="mt-[16px]">
            <div className="flex items-center justify-center md:justify-start gap-2 text-[11px]">
              <span className="text-white/50">
                {formatExecutionDate(act.createdAt)}
              </span>
              <StatusBadge
                status={getStatusBadgeStatus(act.status)}
                variant="dot"
              >
                {act.status || "Unknown"}
              </StatusBadge>
            </div>
          </div>

          {/* Input Values Section */}
          {hasMounted &&
            act.sequences[0]?.steps[0] &&
            (() => {
              const triggerStep = act.sequences[0].steps[0];
              const triggerGeneration = stepGenerations[triggerStep.id];
              const inputs =
                triggerGeneration?.context?.inputs?.find(
                  (input) => input.type === "parameters",
                )?.items || [];

              return inputs.length > 0 ? (
                <div className="mt-[24px]">
                  <button
                    type="button"
                    className="flex items-center justify-between text-[12px] font-medium text-white/60 mb-3 w-full cursor-pointer hover:text-white/80 transition-colors"
                    onClick={() => setIsInputsExpanded(!isInputsExpanded)}
                  >
                    <span>{inputs.length === 1 ? "Input" : "Inputs"}</span>
                    <ChevronDownIcon
                      className={`size-[16px] transition-transform ${
                        isInputsExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isInputsExpanded && (
                    <div className="space-y-2">
                      {inputs.map((input) => {
                        // Find the corresponding parameter definition for user-friendly label
                        const parameter = triggerParameters.find(
                          (param) => param.id === input.name,
                        );

                        return (
                          <div
                            key={`${input.name}-${input.value}`}
                            className="bg-white/5 rounded-[8px] p-3"
                          >
                            <div className="text-[11px] text-white/80">
                              {parameter?.name && (
                                <div className="text-white/50 mb-1">
                                  {parameter.name}
                                </div>
                              )}
                              <div className="text-white/70">
                                {String(input.value)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null;
            })()}
        </div>

        {/* Separator Line */}
        <div className="border-t border-border my-4"></div>

        {/* Steps Section */}
        <div className="space-y-4 pb-4 px-[16px] md:px-[32px] md:flex-1 md:overflow-y-auto md:min-h-0">
          {act.sequences
            .filter((_, index) => index > 0)
            .map((sequence, sequenceIndex) => (
              <div key={sequence.id} className="space-y-3">
                {/* Step Header */}
                <div className="text-[14px] font-medium text-white/60 mb-2">
                  Step {sequenceIndex + 1}
                </div>

                {/* Step Cards */}
                <div className="space-y-2">
                  {sequence.steps.map((step) => {
                    const isExpanded = expandedSteps.has(step.id);
                    const generation = stepGenerations[step.id];

                    const handleStepClick = (e: React.MouseEvent) => {
                      // モバイルの場合はアコーディオン開閉
                      if (window.innerWidth < 768) {
                        e.preventDefault();
                        setExpandedSteps((prev) => {
                          const newSet = new Set(prev);
                          if (newSet.has(step.id)) {
                            newSet.delete(step.id);
                          } else {
                            newSet.add(step.id);
                          }
                          return newSet;
                        });
                      }
                      // デスクトップの場合はページ遷移（Linkのデフォルト動作）
                    };

                    return (
                      <div key={step.id}>
                        <Link
                          href={`/stage/acts/${act.id}/${step.id}`}
                          className="block group"
                          onClick={handleStepClick}
                        >
                          <div className="flex w-full p-4 justify-between items-center rounded-[8px] border border-border bg-transparent hover:bg-ghost-element-hover transition-colors">
                            <div className="flex items-center gap-3">
                              {/* Step Icon */}
                              <div className="w-8 h-8 rounded-[8px] bg-white flex items-center justify-center flex-shrink-0">
                                {step.status === "queued" && (
                                  <CircleDashedIcon className="text-black size-[16px]" />
                                )}
                                {step.status === "running" && (
                                  <RefreshCw className="text-black size-[16px]" />
                                )}
                                {step.status === "completed" &&
                                  (() => {
                                    if (generation) {
                                      return (
                                        <NodeIcon
                                          node={
                                            generation.context.operationNode
                                          }
                                          className="size-[16px] text-black"
                                        />
                                      );
                                    }
                                    return (
                                      <BrainCircuit className="text-black size-[16px]" />
                                    );
                                  })()}
                                {step.status === "failed" && (
                                  <XIcon className="text-black size-[16px]" />
                                )}
                                {step.status === "cancelled" && (
                                  <CircleSlashIcon className="text-black size-[16px]" />
                                )}
                              </div>

                              {/* Step Info */}
                              <div className="flex-1 min-w-0">
                                <div className="text-white font-bold text-[12px]">
                                  {step.name || "Untitled"}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-medium leading-[1.4] text-[var(--color-text-nav-inactive)]">
                                  {step.status === "completed" && generation ? (
                                    <span>
                                      {getModelInfo(generation).modelName}
                                    </span>
                                  ) : null}
                                  {step.status === "running" && "Running"}
                                  {step.status === "failed" && "Failed"}
                                  {step.status === "queued" && "Queued"}
                                  {step.status === "cancelled" && "Cancelled"}
                                </div>
                              </div>
                            </div>

                            {/* Mobile Accordion Arrow */}
                            <div className="block md:hidden ml-2">
                              {isExpanded ? (
                                <ChevronUpIcon className="size-4 text-white/60" />
                              ) : (
                                <ChevronDownIcon className="size-4 text-white/60" />
                              )}
                            </div>
                          </div>
                        </Link>

                        {/* Mobile Accordion Content */}
                        {isExpanded && generation && (
                          <div className="block md:hidden mt-2 bg-white/5 rounded-lg p-4 border border-border">
                            <GenerationView generation={generation} />
                            <MobileActions generation={generation} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </aside>
    </ActStreamReader>
  );
}
