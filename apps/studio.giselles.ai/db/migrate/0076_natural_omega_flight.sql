CREATE TABLE "api_keys" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"id" text NOT NULL,
	"team_db_id" integer NOT NULL,
	"label" text,
	"created_by_user_db_id" integer,
	"redacted_value" text NOT NULL,
	"kdf_type" text NOT NULL,
	"kdf_salt" text NOT NULL,
	"kdf_n" integer NOT NULL,
	"kdf_r" integer NOT NULL,
	"kdf_p" integer NOT NULL,
	"kdf_key_len" integer NOT NULL,
	"secret_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	"revoked_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_user_db_id_users_db_id_fk" FOREIGN KEY ("created_by_user_db_id") REFERENCES "public"."users"("db_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_id_unique" ON "api_keys" USING btree ("id");--> statement-breakpoint
CREATE INDEX "api_keys_team_db_id_idx" ON "api_keys" USING btree ("team_db_id");--> statement-breakpoint
CREATE INDEX "api_keys_revoked_at_idx" ON "api_keys" USING btree ("revoked_at");