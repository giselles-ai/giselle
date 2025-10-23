import type { GiselleEngineContext } from "../types";
import { triggerProviders } from "./trigger-providers";

export function getTriggerProviders(_args: { context: GiselleEngineContext }) {
	return triggerProviders;
}
