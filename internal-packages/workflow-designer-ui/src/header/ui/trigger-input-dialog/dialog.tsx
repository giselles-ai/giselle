import {
  type ActionNode,
  type Input,
  isActionNode,
  type TriggerNode,
} from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle-engine/react";
import { buildWorkflowFromNode } from "@giselle-sdk/workflow-utils";
import { clsx } from "clsx/lite";
import { AlertTriangleIcon, XIcon } from "lucide-react";
import { Dialog } from "radix-ui";
import { type FormEventHandler, useCallback, useMemo, useState } from "react";
import { useFlowController } from "../../../hooks/use-flow-controller";
import { useTrigger } from "../../../hooks/use-trigger";

import {
  buttonLabel,
  createInputsFromTrigger,
  type FormInput,
  parseFormInputs,
} from "./helpers";

export function TriggerInputDialog({
  node,
  onClose,
}: {
  node: TriggerNode;
  onClose: () => void;
}) {
  const { data: trigger, isLoading } = useTrigger(node);
  const { data } = useWorkflowDesigner();

  const inputs = useMemo<FormInput[]>(
    () => createInputsFromTrigger(trigger),
    [trigger],
  );

  const flow = useMemo(() => buildWorkflowFromNode(node, data), [node, data]);

  const requiresActionNodes = useMemo(
    () =>
      flow === null
        ? []
        : flow.nodes
            .filter((n) => isActionNode(n, "github"))
            .map((n) => {
              const notConnectedRequiredInputs = n.inputs.filter(
                (input) =>
                  input.isRequired &&
                  !data.connections.some(
                    (connection) => connection.inputId === input.id,
                  ),
              );
              if (notConnectedRequiredInputs.length === 0) {
                return null;
              }
              return {
                node: n as ActionNode,
                inputs: notConnectedRequiredInputs,
              };
            })
            .filter(
              (item): item is { node: ActionNode; inputs: Input[] } =>
                item !== null,
            ),
    [flow, data.connections],
  );
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { startFlow } = useFlowController();

  const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
    async (e) => {
      e.preventDefault();

      const formData = new FormData(e.currentTarget);
      const { errors, values } = parseFormInputs(inputs, formData);

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }

      setValidationErrors({});
      setIsSubmitting(true);

      try {
        await startFlow(flow, inputs, values, onClose);
      } finally {
        setIsSubmitting(false);
      }
    },
    [inputs, onClose, flow, startFlow],
  );

  if (isLoading || flow === null) {
    return null;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-[14px]">
        <h2 className="font-sans text-[20px] font-medium tracking-tight text-white-400">
          {buttonLabel(node)}
        </h2>
        <div className="flex gap-[12px]">
          <Dialog.Close asChild>
            <button
              type="button"
              className="text-white-400 hover:text-white-900 outline-none"
            >
              <XIcon className="size-[20px]" />
            </button>
          </Dialog.Close>
        </div>
      </div>
      <div className="flex flex-col h-full">
        <form
          className="flex-1 flex flex-col gap-[14px] relative text-white-800 overflow-y-hidden"
          onSubmit={handleSubmit}
        >
          <p className="font-geist mt-2 text-[14px] text-black-400">
            Execute this flow with custom input values
          </p>

          {requiresActionNodes.length > 0 && (
            <div className="bg-red-50 rounded-[6px] p-[10px]">
              <div className="flex items-start gap-[8px]">
                <div className="text-red-500 mt-[2px]">
                  <AlertTriangleIcon className="size-[16px] text-red-700" />
                </div>
                <div className="flex-1">
                  <h4 className="text-red-800 font-medium text-[14px] mb-[4px]">
                    Missing Required Connections
                  </h4>
                  <p className="text-red-700 text-[12px] mb-[8px]">
                    The following action nodes have required inputs that are not
                    connected:
                  </p>
                  <ul className="space-y-[4px]">
                    {requiresActionNodes.map((item) => (
                      <li
                        key={item.node.id}
                        className="text-red-700 text-[12px]"
                      >
                        <span className="font-medium">
                          {item.node.name || "Unnamed Action"}
                        </span>{" "}
                        - Missing:{" "}
                        {item.inputs.map((input) => input.label).join(", ")}
                      </li>
                    ))}
                  </ul>
                  <p className="text-red-700 text-[12px] mt-[8px]">
                    Please connect all required inputs in the workflow designer
                    before running.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-[8px]">
            {inputs.map((input) => {
              return (
                <fieldset key={input.name} className={clsx("grid gap-2")}>
                  <label
                    className="text-[14px] font-medium text-white-900"
                    htmlFor={input.name}
                  >
                    {input.label}
                    {input.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  {input.type === "text" && (
                    <input
                      type="text"
                      name={input.name}
                      id={input.name}
                      className={clsx(
                        "w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
                        "border-[0.5px]",
                        validationErrors[input.name]
                          ? "border-red-500"
                          : "border-white-900",
                        "text-[14px]",
                      )}
                    />
                  )}
                  {input.type === "multiline-text" && (
                    <textarea
                      name={input.name}
                      id={input.name}
                      className={clsx(
                        "w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
                        "border-[0.5px]",
                        validationErrors[input.name]
                          ? "border-red-500"
                          : "border-white-900",
                        "text-[14px]",
                      )}
                      rows={4}
                    />
                  )}
                  {input.type === "number" && (
                    <input
                      type="number"
                      name={input.name}
                      id={input.name}
                      className={clsx(
                        "w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
                        "border-[0.5px]",
                        validationErrors[input.name]
                          ? "border-red-500"
                          : "border-white-900",
                        "text-[14px]",
                      )}
                    />
                  )}
                  {validationErrors[input.name] && (
                    <span className="text-red-500 text-[12px] font-medium">
                      {validationErrors[input.name]}
                    </span>
                  )}
                </fieldset>
              );
            })}
          </div>
          <div className="mt-6 flex justify-end gap-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="relative inline-flex items-center justify-center rounded-lg border-t border-b border-t-white/20 border-b-black/20 px-6 py-2 text-sm font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset,0_0_0_1px_rgba(255,255,255,0.08)] transition-all duration-300 hover:shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset,0_0_0_1px_rgba(255,255,255,0.1)] bg-black/20 border border-white/10 shadow-[inset_0_0_4px_rgba(0,0,0,0.4)] hover:shadow-[inset_0_0_6px_rgba(0,0,0,0.6)]"
              aria-label="Cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || requiresActionNodes.length > 0}
              className="relative inline-flex items-center justify-center rounded-lg border-t border-b border-t-white/20 border-b-black/20 px-6 py-2 text-sm font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset,0_0_0_1px_rgba(255,255,255,0.08)] transition-all duration-300 hover:shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset,0_0_0_1px_rgba(255,255,255,0.1)] text-white/80 bg-gradient-to-b from-[#202530] to-[#12151f] border border-[rgba(0,0,0,0.7)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_2px_8px_rgba(5,10,20,0.4),0_1px_2px_rgba(0,0,0,0.3)] transition-all duration-200 active:scale-[0.98] whitespace-nowrap"
              aria-label={
                isSubmitting
                  ? "Processing..."
                  : requiresActionNodes.length > 0
                    ? "Fix Connections to Run"
                    : "Run"
              }
            >
              {isSubmitting
                ? "Processing..."
                : requiresActionNodes.length > 0
                  ? "Fix Connections to Run"
                  : "Run"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
