CREATE TABLE "api_rate_limit_counters" (
	"team_db_id" integer NOT NULL,
	"route_key" text NOT NULL,
	"window_start" timestamp NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_rate_limit_counters_pk" PRIMARY KEY("team_db_id","route_key","window_start")
);
--> statement-breakpoint
ALTER TABLE "api_rate_limit_counters" ADD CONSTRAINT "api_rate_limit_counters_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_rate_limit_counters_team_window_idx" ON "api_rate_limit_counters" USING btree ("team_db_id","window_start");