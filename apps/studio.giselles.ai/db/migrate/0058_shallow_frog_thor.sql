DROP INDEX "apps_app_entry_node_id_index";--> statement-breakpoint
ALTER TABLE "apps" ADD COLUMN "id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "apps_id_unique" UNIQUE("id");--> statement-breakpoint
ALTER TABLE "apps" ADD CONSTRAINT "apps_app_entry_node_id_unique" UNIQUE("app_entry_node_id");