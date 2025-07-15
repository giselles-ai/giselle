import type {
  ManualTriggerParameter,
  TriggerNode,
} from "@giselle-sdk/data-type";
import { memo, useMemo } from "react";
import { useTrigger } from "../../../../../hooks/use-trigger";

const ParameterItem = memo(({ param }: { param: ManualTriggerParameter }) => (
  <li>
    <div className="flex items-center gap-[8px]">
      <span className="text-[14px]">{param.name}</span>
      <span className="text-[12px] text-blue-400">{param.type}</span>
      {param.required && (
        <span className="bg-red-900/20 text-red-900 text-[12px] font-medium px-[6px] py-[1px] rounded-full">
          required
        </span>
      )}
    </div>
  </li>
));

ParameterItem.displayName = "ParameterItem";

export const ManualTriggerConfiguredView = memo(
  ({ node }: { node: TriggerNode }) => {
    const { isLoading, data } = useTrigger(node);

    const parameters = useMemo(() => {
      return data?.configuration.provider === "manual"
        ? data.configuration.event.parameters
        : [];
    }, [data]);

    if (isLoading) {
      return "Loading...";
    }
    if (data === undefined || data.configuration.provider !== "manual") {
      return "No Data";
    }

    return (
      <div className="flex flex-col gap-[16px] p-0 px-1 overflow-y-auto">
        {parameters.length > 0 && (
          <div className="space-y-[4px]">
            <p className="text-[14px] py-[1.5px] text-[#F7F9FD]">
              Output Parameter
            </p>
            <div className="px-[4px] py-0 w-full bg-transparent text-[14px]">
              <ul className="w-full flex flex-col gap-[12px]">
                {parameters.map((param) => (
                  <ParameterItem key={param.id} param={param} />
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  },
);

ManualTriggerConfiguredView.displayName = "ManualTriggerConfiguredView";
