import * as v from "valibot";
import type { TeamId } from "./types";

function isTeamId(value: string): value is TeamId {
	return value.startsWith("tm_");
}

export const teamIdSchema = v.pipe(
	v.string(),
	v.transform((value) => {
		if (!isTeamId(value)) {
			throw new Error("Invalid TeamId format");
		}
		return value;
	}),
);
