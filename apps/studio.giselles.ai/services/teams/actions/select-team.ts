"use server";

import { redirect } from "next/navigation";
import * as v from "valibot";
import { setCurrentTeam } from "../";
import { teamIdSchema } from "../validations";

export async function selectTeam(data: FormData, withRedirect: boolean) {
	const teamId = v.parse(teamIdSchema, data.get("teamId"));
	await setCurrentTeam(teamId);
	if (withRedirect) {
		redirect("/workspaces");
	}
}
