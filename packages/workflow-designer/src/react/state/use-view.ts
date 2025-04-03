import { useState } from "react";
import { z } from "zod";

export const ViewState = z.enum(["editor", "viewer", "integrator"]);
export type ViewState = z.infer<typeof ViewState>;
export function useView() {
	const [view, setView] = useState<ViewState>("editor");
	return { view, setView };
}
