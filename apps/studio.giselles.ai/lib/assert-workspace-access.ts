import type { WorkspaceId } from "@giselles-ai/protocol";
import { getCurrentUser } from "@/lib/get-current-user";
import { getWorkspaceTeam } from "@/lib/workspaces/get-workspace-team";
import { isMemberOfTeam } from "@/services/teams";

export async function assertWorkspaceAccess(workspaceId: WorkspaceId) {
	try {
		const [currentUser, workspaceTeam] = await Promise.all([
			getCurrentUser(),
			getWorkspaceTeam(workspaceId),
		]);
		const isMember = await isMemberOfTeam(currentUser.dbId, workspaceTeam.dbId);
		if (!isMember) {
			throw new Error("Not authorized");
		}
	} catch (error) {
		console.error("Authorization check failed:", error);
		throw new Error("Not authorized to access this workspace");
	}
}
