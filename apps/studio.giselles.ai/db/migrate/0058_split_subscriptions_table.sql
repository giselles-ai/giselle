-- Create active_subscriptions table
CREATE TABLE "active_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"db_id" serial NOT NULL,
	"team_db_id" integer NOT NULL,
	"customer_id" text NOT NULL,
	"status" text NOT NULL,
	"cancel_at_period_end" boolean NOT NULL,
	"cancel_at" timestamp,
	"canceled_at" timestamp,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"trial_start" timestamp,
	"trial_end" timestamp
);
--> statement-breakpoint
ALTER TABLE "active_subscriptions" ADD CONSTRAINT "active_subscriptions_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "active_subscriptions_id_unique" ON "active_subscriptions" USING btree ("id");--> statement-breakpoint
CREATE INDEX "active_subscriptions_team_db_id_index" ON "active_subscriptions" USING btree ("team_db_id");--> statement-breakpoint
CREATE INDEX "active_subscriptions_status_index" ON "active_subscriptions" USING btree ("status");

-- Create subscription_history table
CREATE TABLE "subscription_history" (
	"id" text PRIMARY KEY NOT NULL,
	"db_id" serial NOT NULL,
	"team_db_id" integer NOT NULL,
	"customer_id" text NOT NULL,
	"status" text NOT NULL,
	"cancel_at_period_end" boolean NOT NULL,
	"cancel_at" timestamp,
	"canceled_at" timestamp,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp NOT NULL,
	"trial_start" timestamp,
	"trial_end" timestamp
);
--> statement-breakpoint
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_history_id_unique" ON "subscription_history" USING btree ("id");--> statement-breakpoint
CREATE INDEX "subscription_history_team_db_id_index" ON "subscription_history" USING btree ("team_db_id");--> statement-breakpoint
CREATE INDEX "subscription_history_status_index" ON "subscription_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscription_history_ended_at_index" ON "subscription_history" USING btree ("ended_at");

-- Migrate existing data from subscriptions table
-- Active subscriptions: status is 'active' or ended_at is NULL
INSERT INTO "active_subscriptions" (
	"id",
	"team_db_id",
	"customer_id",
	"status",
	"cancel_at_period_end",
	"cancel_at",
	"canceled_at",
	"current_period_start",
	"current_period_end",
	"created",
	"ended_at",
	"trial_start",
	"trial_end"
)
SELECT
	"id",
	"team_db_id",
	"customer_id",
	"status",
	"cancel_at_period_end",
	"cancel_at",
	"canceled_at",
	"current_period_start",
	"current_period_end",
	"created",
	"ended_at",
	"trial_start",
	"trial_end"
FROM "subscriptions"
WHERE "status" = 'active' OR "ended_at" IS NULL;

-- Historical subscriptions: ended_at is NOT NULL or status is 'canceled', 'unpaid', 'incomplete_expired'
INSERT INTO "subscription_history" (
	"id",
	"team_db_id",
	"customer_id",
	"status",
	"cancel_at_period_end",
	"cancel_at",
	"canceled_at",
	"current_period_start",
	"current_period_end",
	"created",
	"ended_at",
	"trial_start",
	"trial_end"
)
SELECT
	"id",
	"team_db_id",
	"customer_id",
	"status",
	"cancel_at_period_end",
	"cancel_at",
	"canceled_at",
	"current_period_start",
	"current_period_end",
	"created",
	COALESCE("ended_at", "created") as "ended_at",
	"trial_start",
	"trial_end"
FROM "subscriptions"
WHERE "ended_at" IS NOT NULL 
	OR "status" IN ('canceled', 'unpaid', 'incomplete_expired')
	OR ("status" != 'active' AND "ended_at" IS NULL AND "created" < NOW() - INTERVAL '1 year');
