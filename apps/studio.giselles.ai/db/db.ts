import { sql } from "@vercel/postgres";
import { drizzle as drizzleLocal } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { isLocalStudio, localStudioSetting } from "@/lib/local-studio";
import * as schema from "./schema";

export const db = isLocalStudio
	? drizzleLocal(localStudioSetting("POSTGRES_URL"), { schema })
	: drizzle(sql, { schema, logger: false });
