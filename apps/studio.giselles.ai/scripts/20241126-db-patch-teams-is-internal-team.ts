import { createClient } from "@supabase/supabase-js";
import { eq, inArray } from "drizzle-orm";
import { db, supabaseUserMappings, teamMemberships, teams } from "@/drizzle";

console.log("Updating teams to set 'type = internal' property on nodes...");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
	throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceRoleKey) {
	throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});

const allTeams = await db
	.select({
		teamDbId: teams.dbId,
		type: teams.type,
		supabaseUserId: supabaseUserMappings.supabaseUserId,
	})
	.from(teams)
	.innerJoin(teamMemberships, eq(teams.dbId, teamMemberships.teamDbId))
	.innerJoin(
		supabaseUserMappings,
		eq(teamMemberships.userDbId, supabaseUserMappings.userDbId),
	);

const { data, error } = await supabase.auth.admin.listUsers({
	perPage: 500, // 500 is enough for now
});
if (error) {
	console.error("Error fetching users", error);
	throw error;
}
const allSupabaseUsers = data.users;
const supabaseUserIdToEmail = new Map<string, string>();
for (const user of allSupabaseUsers) {
	supabaseUserIdToEmail.set(user.id, user.email ?? "");
}

const internalTeamIds = new Set<number>();
for (const team of allTeams) {
	if (team.type === "internal") {
		continue;
	}
	const supabaseUserId = team.supabaseUserId;
	const email = supabaseUserIdToEmail.get(supabaseUserId) ?? "";
	if (email.endsWith("@route06.co.jp")) {
		internalTeamIds.add(team.teamDbId);
	}
}

if (internalTeamIds.size === 0) {
	console.log("No teams to update");
}
const result = await db
	.update(teams)
	.set({ type: "internal" })
	.where(inArray(teams.dbId, Array.from(internalTeamIds)));
console.log("result: %o", result);
