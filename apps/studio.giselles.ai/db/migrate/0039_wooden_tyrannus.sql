ALTER TABLE "acts" RENAME COLUMN "sdk_flow_run_id" TO "sdk_act_id";--> statement-breakpoint
DROP INDEX "acts_sdk_flow_run_id_index";--> statement-breakpoint
CREATE INDEX "acts_sdk_act_id_index" ON "acts" USING btree ("sdk_act_id");