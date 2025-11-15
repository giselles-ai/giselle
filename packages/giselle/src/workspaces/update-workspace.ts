import type { Workspace } from "@giselles-ai/protocol";
import { revalidatePath } from "next/cache";
import type { GiselleContext } from "../types";
import { setWorkspace } from "./utils";

export async function updateWorkspace(args: {
	context: GiselleContext;
	workspace: Workspace;
}) {
	await setWorkspace({
		workspaceId: args.workspace.id,
		workspace: args.workspace,
		storage: args.context.storage,
	});
	revalidatePath(`/workspaces/${args.workspace.id}`, "layout");
	return args.workspace;
}
