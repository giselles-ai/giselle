import * as v from "valibot";
import { teamIdSchema } from "@/services/teams/validations";
import { getCookie, setCookie } from "./signed-cookie";

const COOKIE_NAME = "giselle-session";

const GiselleSessionSchema = v.object({
	teamId: v.optional(teamIdSchema),
	// used in creating a new pro team flow
	checkoutSessionId: v.optional(v.string()),
});

type GiselleSession = v.InferOutput<typeof GiselleSessionSchema>;

export async function getGiselleSession(): Promise<GiselleSession | null> {
	const rawSession = await getCookie(COOKIE_NAME);
	if (rawSession == null) {
		return null;
	}
	return v.parse(GiselleSessionSchema, rawSession);
}

export async function updateGiselleSession(session: Partial<GiselleSession>) {
	const currentSession = await getGiselleSession();
	const values = v.parse(GiselleSessionSchema, {
		...currentSession,
		...session,
	});
	await setGiselleSession(values);
}

async function setGiselleSession(session: GiselleSession) {
	await setCookie(COOKIE_NAME, v.parse(GiselleSessionSchema, session));
}
