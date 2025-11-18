CREATE TABLE "subscription_histories" (
	"id" text NOT NULL,
	"db_id" serial PRIMARY KEY NOT NULL,
	"team_db_id" integer NOT NULL,
	"customer_id" text NOT NULL,
	"status" text NOT NULL,
	"cancel_at_period_end" boolean NOT NULL,
	"cancel_at" timestamp,
	"canceled_at" timestamp,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"created" timestamp NOT NULL,
	"ended_at" timestamp,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscription_histories" ADD CONSTRAINT "subscription_histories_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sub_hist_id_created_at_idx" ON "subscription_histories" USING btree ("id","created_at");--> statement-breakpoint
CREATE INDEX "sub_hist_team_db_id_created_at_idx" ON "subscription_histories" USING btree ("team_db_id","created_at");--> statement-breakpoint
CREATE INDEX "sub_hist_id_team_db_id_created_at_idx" ON "subscription_histories" USING btree ("id","team_db_id","created_at");