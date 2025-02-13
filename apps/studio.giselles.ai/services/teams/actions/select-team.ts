"use server";

import * as v from "valibot";
import { setCurrentTeam } from "../";
import { teamIdSchema } from "../validations";

export async function selectTeam(data: FormData) {
	const teamId = v.parse(teamIdSchema, data.get("teamId"));
	await setCurrentTeam(teamId);
}
