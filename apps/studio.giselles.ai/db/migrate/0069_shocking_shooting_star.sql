CREATE TABLE "stripe_billing_cadence_histories" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"team_db_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text NOT NULL,
	"customer_id" text NOT NULL,
	"billing_profile_id" text NOT NULL,
	"payer_type" text NOT NULL,
	"billing_cycle_type" text NOT NULL,
	"billing_cycle_interval_count" integer NOT NULL,
	"billing_cycle_day_of_month" integer,
	"billing_cycle_month_of_year" integer,
	"billing_cycle_time_hour" integer NOT NULL,
	"billing_cycle_time_minute" integer NOT NULL,
	"billing_cycle_time_second" integer NOT NULL,
	"next_billing_date" timestamp NOT NULL,
	"status" text NOT NULL,
	"bill_settings_id" text,
	"created" timestamp NOT NULL,
	"metadata" jsonb,
	"lookup_key" text
);
--> statement-breakpoint
CREATE TABLE "stripe_pricing_plan_subscription_histories" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"team_db_id" integer NOT NULL,
	"billing_cadence_db_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text NOT NULL,
	"billing_cadence_id" text NOT NULL,
	"pricing_plan_id" text NOT NULL,
	"pricing_plan_version_id" text NOT NULL,
	"servicing_status" text NOT NULL,
	"collection_status" text NOT NULL,
	"activated_at" timestamp,
	"canceled_at" timestamp,
	"paused_at" timestamp,
	"collection_current_at" timestamp,
	"collection_past_due_at" timestamp,
	"collection_paused_at" timestamp,
	"collection_unpaid_at" timestamp,
	"collection_awaiting_customer_action_at" timestamp,
	"created" timestamp NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "stripe_billing_cadence_histories" ADD CONSTRAINT "stripe_billing_cadence_histories_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_pricing_plan_subscription_histories" ADD CONSTRAINT "stripe_pricing_plan_subscription_histories_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_pricing_plan_subscription_histories" ADD CONSTRAINT "stripe_pricing_plan_subscription_histories_billing_cadence_db_id_stripe_billing_cadence_histories_db_id_fk" FOREIGN KEY ("billing_cadence_db_id") REFERENCES "public"."stripe_billing_cadence_histories"("db_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stripe_cadence_hist_id_idx" ON "stripe_billing_cadence_histories" USING btree ("id");--> statement-breakpoint
CREATE INDEX "stripe_cadence_hist_team_db_id_idx" ON "stripe_billing_cadence_histories" USING btree ("team_db_id");--> statement-breakpoint
CREATE INDEX "stripe_cadence_hist_customer_id_idx" ON "stripe_billing_cadence_histories" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "stripe_pps_hist_id_idx" ON "stripe_pricing_plan_subscription_histories" USING btree ("id");--> statement-breakpoint
CREATE INDEX "stripe_pps_hist_team_db_id_idx" ON "stripe_pricing_plan_subscription_histories" USING btree ("team_db_id");--> statement-breakpoint
CREATE INDEX "stripe_pps_hist_billing_cadence_db_id_idx" ON "stripe_pricing_plan_subscription_histories" USING btree ("billing_cadence_db_id");