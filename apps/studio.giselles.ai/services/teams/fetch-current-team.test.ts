import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/pg-proxy";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { getCurrentUser } from "@/lib/get-current-user";
import { getGiselleSession } from "@/lib/giselle-session";
import { fetchCurrentTeam } from "./fetch-current-team";

vi.mock("@/lib/local-studio", () => ({ isLocalStudio: false }));
vi.mock("@/lib/get-current-user", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/giselle-session", () => ({ getGiselleSession: vi.fn() }));
vi.mock("@/db", async () => ({
	...(await import("@/db/schema")),
	// Execute the actual membership query against fixture rows without a running service.
	db: drizzle((sql, params) => {
		const statement = database.prepare(sql.replace(/\$\d+/g, "?"));
		return Promise.resolve({
			rows: statement.all(...params).map((row) => Object.values(row)),
		});
	}),
}));

const database = new DatabaseSync(":memory:");
beforeAll(() => {
	database.exec(`
		CREATE TABLE teams (db_id INTEGER PRIMARY KEY, id TEXT, name TEXT, avatar_url TEXT,
			plan TEXT, active_subscription_id TEXT, active_customer_id TEXT);
		CREATE TABLE team_memberships (user_db_id INTEGER, team_db_id INTEGER);
		INSERT INTO teams (db_id,id,name,plan) VALUES (1,'tm_other','Other','free'),
			(2,'tm_first','First','free'),(3,'tm_selected','Selected','free');
		INSERT INTO team_memberships VALUES (10,3),(10,2),(11,1);
	`);
	vi.mocked(getCurrentUser).mockResolvedValue({
		dbId: 10,
		id: "usr_member",
		email: null,
		avatarUrl: null,
		displayName: null,
	});
});
afterAll(() => database.close());

it("selects the session team when the authenticated user belongs to it", async () => {
	vi.mocked(getGiselleSession).mockResolvedValue({ teamId: "tm_selected" });
	expect((await fetchCurrentTeam()).id).toBe("tm_selected");
});

it.each([null, { teamId: "tm_other" as const }])(
	"falls back to the user's first membership for session %j",
	async (session) => {
		vi.mocked(getGiselleSession).mockResolvedValue(session);
		expect((await fetchCurrentTeam()).id).toBe("tm_first");
	},
);

it("rejects a user without memberships even if the session selects an existing team", async () => {
	vi.mocked(getCurrentUser).mockResolvedValueOnce({
		dbId: 12,
		id: "usr_new",
		email: null,
		avatarUrl: null,
		displayName: null,
	});
	vi.mocked(getGiselleSession).mockResolvedValue({ teamId: "tm_selected" });
	await expect(fetchCurrentTeam()).rejects.toThrow("User does not have a team");
});
