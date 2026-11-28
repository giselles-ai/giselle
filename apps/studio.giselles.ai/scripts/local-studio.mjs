import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import next from "next";
import pg from "pg";

process.env.NODE_ENV = "development";
const hostname = "127.0.0.1";
const port = Number(process.env.PORT || 3100);
const origin = new URL(`http://${hostname}:${port}`);
const directory = join(homedir(), ".giselle", "studio-local");
await mkdir(directory, { recursive: true, mode: 0o700 });
const passwordPath = join(directory, "postgres-password");
try {
	await writeFile(passwordPath, randomBytes(32).toString("hex"), {
		flag: "wx",
		mode: 0o600,
	});
} catch (error) {
	if (error.code !== "EEXIST") throw error;
}
const password = await readFile(passwordPath, "utf8");
execFileSync(
	"docker",
	["compose", "-f", "compose.local.yaml", "up", "-d", "--wait"],
	{
		stdio: "inherit",
		env: { ...process.env, GISELLE_LOCAL_DB_PASSWORD: password },
	},
);
process.env.POSTGRES_URL = `postgres://postgres:${password}@127.0.0.1:55439/giselle_local`;
process.env.GISELLE_LOCAL_STUDIO = "1";
process.env.GISELLE_DATA_DIR = join(directory, "workflows");
const pool = new pg.Pool({ connectionString: process.env.POSTGRES_URL });
try {
	await migrate(drizzle(pool), { migrationsFolder: "db/migrate" });
	await pool.query(`
		BEGIN;
		INSERT INTO users (id, display_name) VALUES ('usr_local', 'Local user') ON CONFLICT (id) DO NOTHING;
		INSERT INTO teams (id, name) VALUES ('tm_local', 'Local workspace') ON CONFLICT (id) DO NOTHING;
		INSERT INTO team_memberships (user_db_id, team_db_id, role)
		SELECT users.db_id, teams.db_id, 'admin' FROM users, teams
		WHERE users.id = 'usr_local' AND teams.id = 'tm_local' ON CONFLICT DO NOTHING;
		COMMIT;
	`);
} finally {
	await pool.end();
}

const app = next({ dev: true, hostname, port });
await app.prepare();
const handle = app.getRequestHandler();
const server = createServer((request, response) => {
	const isMutation = !["GET", "HEAD", "OPTIONS"].includes(request.method);
	if (
		request.headers.host !== origin.host ||
		(isMutation && request.headers.origin !== origin.origin)
	) {
		response.writeHead(403).end();
		return;
	}
	handle(request, response);
});
const upgrade = app.getUpgradeHandler();
server.on("upgrade", (request, socket, head) => {
	if (
		request.headers.host !== origin.host ||
		request.headers.origin !== origin.origin
	) {
		socket.destroy();
		return;
	}
	upgrade(request, socket, head);
});
server.listen(port, hostname, () =>
	console.log(`Studio: ${origin.origin}/workspaces`),
);
