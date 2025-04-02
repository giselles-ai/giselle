import {
  type Workflow,
  type WorkflowId,
  type OverrideNode,
} from "@giselle-sdk/data-type";
import { Dialog } from "radix-ui";
import { useState, useCallback, useEffect } from "react";
import { X, PencilIcon } from "lucide-react";
import { Button } from "../ui/button";
import { RunWithOverrideParamsForm } from "./run-with-override-params-form";

// Global state to store current override nodes
let currentOverrideNodes: OverrideNode[] = [];

export function DialogWithOverrideForm({
  flow,
  workspaceId,
  onRunWithOverride,
}: {
  flow: Workflow;
  workspaceId: WorkflowId;
  onRunWithOverride: (nodes: OverrideNode[]) => void;
}) {
  // Dialog open/close state
  const [open, setOpen] = useState(false);
  // Override nodes state
  const [overrideNodes, setOverrideNodes] = useState<OverrideNode[]>([]);

  // Initialize state when opening the modal
  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    // Set initial data when modal is opened
    if (isOpen) {
      setOverrideNodes(currentOverrideNodes);
    }
  }, []);

  // Function to update override nodes
  const handleNodesChange = useCallback((nodes: OverrideNode[]) => {
    setOverrideNodes(nodes);
    currentOverrideNodes = nodes;
  }, []);

  // Handle Run with override button
  const handleRunWithOverride = useCallback(() => {
    onRunWithOverride(overrideNodes);
    setOpen(false);
  }, [overrideNodes, onRunWithOverride]);

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button
          type="button"
          className="bg-primary-900 hover:bg-primary-800"
        >
          <div className="flex items-center gap-[8px]">
            <PencilIcon className="h-3 w-3" />
            <span>Run with override</span>
          </div>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 z-40" />
        <Dialog.Content
          className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[900px] h-[600px] bg-black-900 rounded-[12px] p-[24px] shadow-xl z-50 overflow-hidden border border-black-400"
        >
          <Dialog.Title className="sr-only">
            Override inputs to test workflow
          </Dialog.Title>
          <div className="flex justify-between items-center mb-[24px]">
            <h2 className="font-accent text-[18px] font-bold text-primary-100 drop-shadow-[0_0_10px_#0087F6]">
              Override inputs to test workflow
            </h2>
            <div className="flex gap-[12px]">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="text-white-400 hover:text-white-900"
                >
                  <X className="size-[20px]" />
                </button>
              </Dialog.Close>
              <Button
                type="button"
                className="bg-primary-900 hover:bg-primary-800"
                onClick={handleRunWithOverride}
              >
                Run with override
              </Button>
            </div>
          </div>
          <RunWithOverrideParamsForm
            flow={flow}
            onNodesChange={handleNodesChange}
            isModalOpen={open}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 