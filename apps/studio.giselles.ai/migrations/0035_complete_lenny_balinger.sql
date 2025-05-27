CREATE INDEX IF NOT EXISTS "model_usage_team_db_id_index" ON "model_usage" USING btree ("team_db_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "model_usage_agent_db_id_index" ON "model_usage" USING btree ("agent_db_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "model_usage_created_at_index" ON "model_usage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "model_usage_items_model_usage_db_id_index" ON "model_usage_items" USING btree ("model_usage_db_id");