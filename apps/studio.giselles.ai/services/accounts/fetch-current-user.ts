import { getCurrentUser } from "@/lib/get-current-user";

export async function fetchCurrentUser() {
	const { id, dbId } = await getCurrentUser();
	return { id, dbId };
}
