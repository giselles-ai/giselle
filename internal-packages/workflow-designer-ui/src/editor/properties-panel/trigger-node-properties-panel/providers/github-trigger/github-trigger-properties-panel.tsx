import {
  type GitHubFlowTriggerEvent,
  type Output,
  OutputId,
  type TriggerNode,
} from "@giselle-sdk/data-type";
import { type GitHubTriggerEventId, githubTriggers } from "@giselle-sdk/flow";
import type { GitHubIntegrationInstallation } from "@giselle-sdk/giselle-engine";
import {
  useFeatureFlag,
  useGiselleEngine,
  useIntegration,
  useWorkflowDesigner,
} from "@giselle-sdk/giselle-engine/react";
import clsx from "clsx/lite";
import { InfoIcon } from "lucide-react";
import {
  type FormEventHandler,
  useCallback,
  useState,
  useTransition,
} from "react";
import { Tooltip } from "../../../../../ui/tooltip";
import { SelectRepository } from "../../../ui";
import { GitHubTriggerConfiguredView } from "../../ui";
import { EventSelectionStep } from "./components/event-selection-step";
import { EventTypeDisplay } from "./components/event-type-display";
import { InstallGitHubApplication } from "./components/install-application";
import { RepositoryDisplay } from "./components/repository-display";
import { Unauthorized } from "./components/unauthorized";

export function GitHubTriggerPropertiesPanel({ node }: { node: TriggerNode }) {
  const { value } = useIntegration();

  if (node.content.state.status === "configured") {
    return (
      <GitHubTriggerConfiguredView
        flowTriggerId={node.content.state.flowTriggerId}
      />
    );
  }

  if (value?.github === undefined) {
    return "unset";
  }

  switch (value.github.status) {
    case "unset":
      return "unset";
    case "unauthorized":
      return <Unauthorized authUrl={value.github.authUrl} />;
    case "not-installed":
      return (
        <InstallGitHubApplication
          installationUrl={value.github.installationUrl}
        />
      );
    case "invalid-credential":
      return "invalid-credential";
    case "installed":
      return (
        <Installed
          installations={value.github.installations}
          node={node}
          installationUrl={value.github.installationUrl}
        />
      );
    case "error":
      return `GitHub integration error: ${value.github.errorMessage}`;
    default: {
      const _exhaustiveCheck: never = value.github;
      throw new Error(`Unhandled status: ${_exhaustiveCheck}`);
    }
  }
}

interface SelectEventStep {
  state: "select-event";
}

interface SelectRepositoryStep {
  state: "select-repository";
  eventId: GitHubTriggerEventId;
}

interface InputCallsignStep {
  state: "input-callsign";
  eventId: GitHubTriggerEventId;
  owner: string;
  repo: string;
  repoNodeId: string;
  installationId: number;
}

interface ConfirmRepositoryStep {
  state: "confirm-repository";
  eventId: GitHubTriggerEventId;
  installationId: number;
  owner: string;
  repo: string;
  repoNodeId: string;
}

export type GitHubTriggerSetupStep =
  | SelectEventStep
  | SelectRepositoryStep
  | InputCallsignStep
  | ConfirmRepositoryStep;

/**
 * Determines if a trigger type requires a callsign
 */
function isTriggerRequiringCallsign(eventId: GitHubTriggerEventId): boolean {
  return [
    "github.issue_comment.created",
    "github.pull_request_comment.created",
    "github.pull_request_review_comment.created",
  ].includes(eventId);
}

function Installed({
  installations,
  node,
  installationUrl,
}: {
  installations: GitHubIntegrationInstallation[];
  node: TriggerNode;
  installationUrl: string;
}) {
  const { experimental_storage } = useFeatureFlag();
  const [step, setStep] = useState<GitHubTriggerSetupStep>({
    state: "select-event",
  });
  const { data: workspace, updateNodeData } = useWorkflowDesigner();
  const client = useGiselleEngine();
  const [isPending, startTransition] = useTransition();
  const [eventId, setEventId] = useState<GitHubTriggerEventId>(
    "github.issue.created",
  );

  const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
    (e) => {
      e.preventDefault();

      if (step.state !== "input-callsign") {
        throw new Error("Unexpected state");
      }

      let event: GitHubFlowTriggerEvent | undefined;
      const formData = new FormData(e.currentTarget);

      switch (eventId) {
        case "github.issue.created":
        case "github.issue.closed":
        case "github.pull_request.ready_for_review":
        case "github.pull_request.closed":
        case "github.pull_request.opened":
          event = {
            id: eventId,
          };
          break;
        case "github.issue_comment.created": {
          const callsign = formData.get("callsign");
          if (typeof callsign !== "string" || callsign.length === 0) {
            throw new Error("Unexpected request");
          }
          event = {
            id: "github.issue_comment.created",
            conditions: {
              callsign,
            },
          };
          break;
        }
        case "github.pull_request_comment.created": {
          const callsign = formData.get("callsign");
          if (typeof callsign !== "string" || callsign.length === 0) {
            throw new Error("Unexpected request");
          }
          event = {
            id: "github.pull_request_comment.created",
            conditions: {
              callsign,
            },
          };
          break;
        }
        case "github.pull_request_review_comment.created": {
          const callsign = formData.get("callsign");
          if (typeof callsign !== "string" || callsign.length === 0) {
            throw new Error("Unexpected request");
          }
          event = {
            id: "github.pull_request_review_comment.created",
            conditions: {
              callsign,
            },
          };
          break;
        }
        default: {
          const _exhaustiveCheck: never = eventId;
          throw new Error(`Unhandled eventId: ${_exhaustiveCheck}`);
        }
      }

      if (event === undefined) {
        return;
      }

      const trigger = githubTriggers[event.id];
      const outputs: Output[] = [];

      for (const key of trigger.event.payloads.keyof().options) {
        outputs.push({
          id: OutputId.generate(),
          label: key,
          accessor: key,
        });
      }

      startTransition(async () => {
        try {
          const { triggerId } = await client.configureTrigger({
            trigger: {
              nodeId: node.id,
              workspaceId: workspace?.id,
              enable: false,
              configuration: {
                provider: "github",
                repositoryNodeId: step.repoNodeId,
                installationId: step.installationId,
                event,
              },
            },
            useExperimentalStorage: experimental_storage,
          });

          updateNodeData(node, {
            content: {
              ...node.content,
              state: {
                status: "configured",
                flowTriggerId: triggerId,
              },
            },
            outputs: [...node.outputs, ...outputs],
            name: `On ${trigger.event.label}`,
          });
        } catch (error) {
          console.error("Failed to configure trigger:", error);
        }
      });
    },
    [
      workspace?.id,
      client.configureTrigger,
      node,
      updateNodeData,
      step,
      eventId,
      experimental_storage,
    ],
  );

  return (
    <div className="flex flex-col gap-[8px] h-full px-1">
      {step.state === "select-event" && (
        <EventSelectionStep
          selectedEventId={eventId}
          onSelectEvent={(id) => {
            setEventId(id);
            setStep({
              state: "select-repository",
              eventId: id,
            });
          }}
        />
      )}

      {step.state === "select-repository" && (
        <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar h-full relative">
          <p className="text-[14px] text-[#F7F9FD] mb-2">Event type</p>
          <EventTypeDisplay
            eventId={step.eventId}
            className="mb-4"
            showDescription={false}
          />

          <p className="text-[14px] text-[#F7F9FD] mb-3">Organization</p>
          <div className="px-[4px] py-[4px]">
            <SelectRepository
              installations={installations}
              installationUrl={installationUrl}
              onSelectRepository={(value, setLoading) => {
                setLoading(true);
                // Always proceed to confirmation step first
                setStep({
                  state: "confirm-repository",
                  eventId: step.eventId,
                  installationId: value.installationId,
                  owner: value.owner,
                  repo: value.repo,
                  repoNodeId: value.repoNodeId,
                });
                setLoading(false);
              }}
            />
          </div>
        </div>
      )}

      {step.state === "confirm-repository" && (
        <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar h-full relative">
          <div className="flex flex-col gap-[8px]">
            <p className="text-[14px] text-[#F7F9FD] mb-2">Event type</p>
            <EventTypeDisplay eventId={step.eventId} showDescription={false} />
            <RepositoryDisplay
              owner={step.owner}
              repo={step.repo}
              className="mt-2 mb-2"
            />

            <div className="flex gap-[8px] mt-[12px] px-[4px]">
              <button
                type="button"
                className="flex-1 bg-black-700 hover:bg-black-600 text-white font-medium px-4 py-2 rounded-md text-[14px] transition-colors disabled:opacity-50 relative"
                onClick={() => {
                  // Go back to repository selection
                  setStep({
                    state: "select-repository",
                    eventId: step.eventId,
                  });
                }}
                disabled={isPending}
              >
                <span className={isPending ? "opacity-0" : ""}>Back</span>
              </button>
              <button
                type="button"
                className="flex-1 bg-primary-900 hover:bg-primary-800 text-white font-medium px-4 py-2 rounded-md text-[14px] transition-colors disabled:opacity-50 relative"
                onClick={() => {
                  // Process based on whether callsign is required
                  if (isTriggerRequiringCallsign(step.eventId)) {
                    setStep({
                      state: "input-callsign",
                      eventId: step.eventId,
                      installationId: step.installationId,
                      owner: step.owner,
                      repo: step.repo,
                      repoNodeId: step.repoNodeId,
                    });
                  } else {
                    // If callsign is not required, execute trigger configuration
                    startTransition(async () => {
                      try {
                        const event = { id: step.eventId };
                        const trigger = githubTriggers[step.eventId];
                        const outputs: Output[] = [];

                        for (const key of trigger.event.payloads.keyof()
                          .options) {
                          outputs.push({
                            id: OutputId.generate(),
                            label: key,
                            accessor: key,
                          });
                        }

                        const { triggerId } = await client.configureTrigger({
                          trigger: {
                            nodeId: node.id,
                            workspaceId: workspace?.id,
                            enable: false,
                            configuration: {
                              provider: "github",
                              repositoryNodeId: step.repoNodeId,
                              installationId: step.installationId,
                              event,
                            },
                          },
                          useExperimentalStorage: experimental_storage,
                        });

                        updateNodeData(node, {
                          content: {
                            ...node.content,
                            state: {
                              status: "configured",
                              flowTriggerId: triggerId,
                            },
                          },
                          outputs: [...node.outputs, ...outputs],
                          name: `On ${trigger.event.label}`,
                        });
                      } catch (error) {
                        console.error("Failed to configure trigger:", error);
                      }
                    });
                  }
                }}
              >
                <span className={isPending ? "opacity-0" : ""}>
                  {isTriggerRequiringCallsign(step.eventId)
                    ? "Continue"
                    : "Set Up"}
                </span>
                {isPending && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {step.state === "input-callsign" && (
        <form
          className="w-full flex flex-col gap-[8px] overflow-y-auto flex-1 pr-2 custom-scrollbar"
          onSubmit={handleSubmit}
        >
          <p className="text-[14px] text-[#F7F9FD] mb-2">Event type</p>
          <EventTypeDisplay eventId={step.eventId} showDescription={false} />
          <RepositoryDisplay
            owner={step.owner}
            repo={step.repo}
            className="mt-2 mb-2"
          />

          <fieldset className="flex flex-col gap-[8px]">
            <div className="flex items-center gap-[4px] px-[4px]">
              <p className="text-[14px] text-[#F7F9FD]">Callsign</p>
              <Tooltip
                text={
                  <p className="w-[260px]">
                    Only comments starting with this callsign will trigger the
                    workflow, preventing unnecessary executions from unrelated
                    comments.
                  </p>
                }
              >
                <button type="button">
                  <InfoIcon className="size-[16px]" />
                </button>
              </Tooltip>
            </div>
            <div className="relative px-[4px]">
              <div className="absolute inset-y-0 left-[16px] flex items-center pointer-events-none">
                <span className="text-[14px]">/</span>
              </div>
              <input
                type="text"
                name="callsign"
                className={clsx(
                  "group w-full flex justify-between items-center rounded-[8px] py-[8px] pl-[28px] pr-[4px] outline-none focus:outline-none",
                  "border border-white-400 focus:border-white-900",
                  "text-[14px] bg-transparent",
                )}
                placeholder="code-review"
                autoFocus
              />
            </div>
            <p className="text-[12px] text-white-400 pl-2">
              A callsign is required for issue comment triggers. Examples:
              /code-review, /check-policy
            </p>
          </fieldset>

          <div className="pt-[8px] flex gap-[8px] mt-[12px] px-[4px]">
            <button
              type="button"
              className="flex-1 bg-black-700 hover:bg-black-600 text-white font-medium px-4 py-2 rounded-md text-[14px] transition-colors disabled:opacity-50 relative"
              onClick={() => {
                // Go back to repository selection
                setStep({
                  state: "select-repository",
                  eventId: step.eventId,
                });
              }}
              disabled={isPending}
            >
              <span className={isPending ? "opacity-0" : ""}>Back</span>
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary-900 hover:bg-primary-800 text-white font-medium px-4 py-2 rounded-md text-[14px] transition-colors disabled:opacity-50 relative"
              disabled={isPending}
            >
              <span className={isPending ? "opacity-0" : ""}>
                {isPending ? "Setting up..." : "Set Up"}
              </span>
              {isPending && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </span>
              )}
            </button>
          </div>
        </form>
      )}

      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.15);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
