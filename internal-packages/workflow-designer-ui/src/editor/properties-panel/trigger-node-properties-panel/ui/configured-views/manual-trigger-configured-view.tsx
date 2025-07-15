import type {
  ManualTriggerParameter,
  TriggerNode,
} from "@giselle-sdk/data-type";
import { useTrigger } from "../../../../../hooks/use-trigger";

export function ManualTriggerConfiguredView({ node }: { node: TriggerNode }) {
  const { isLoading, data } = useTrigger(node);
  if (isLoading) {
    return "Loading...";
  }
  if (data === undefined || data.configuration.provider !== "manual") {
    return "No Data";
  }

  return (
    <div className="flex flex-col gap-[16px] p-0 px-1 overflow-y-auto">
      {data.configuration.event.parameters.length > 0 && (
        <div className="space-y-[4px]">
          <p className="text-[14px] py-[1.5px] text-[#F7F9FD]">
            Output Parameter
          </p>
          <div className="px-[4px] py-0 w-full bg-transparent text-[14px]">
            <div className="flex flex-col gap-[8px]">
              {data.configuration.event.parameters.map(
                (param: ManualTriggerParameter) => (
                  <div
                    key={param.id}
                    className="flex items-center justify-between p-[8px] bg-white-900/10 rounded-[4px]"
                  >
                    <div className="flex items-center gap-[8px]">
                      <span className="font-medium text-[14px]">
                        {param.name}
                      </span>
                      <span className="text-[12px] text-black-500">
                        {param.type}
                        {param.required ? " (required)" : ""}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
