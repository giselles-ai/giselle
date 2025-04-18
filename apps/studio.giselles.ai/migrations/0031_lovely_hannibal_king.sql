CREATE TABLE IF NOT EXISTS "invitations" (
	"token" text NOT NULL,
	"team_db_id" integer NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"invite_user_db_id" integer NOT NULL,
	"expired_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invitations" ADD CONSTRAINT "invitations_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invite_user_db_id_users_db_id_fk" FOREIGN KEY ("invite_user_db_id") REFERENCES "public"."users"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invitations_team_db_id_revoked_at_index" ON "invitations" USING btree ("team_db_id","revoked_at");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "avatar_url";