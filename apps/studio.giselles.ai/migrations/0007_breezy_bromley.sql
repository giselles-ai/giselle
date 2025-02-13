ALTER TABLE "github_integrations" ADD COLUMN "id" text;--> statement-breakpoint
ALTER TABLE "github_integrations" ADD CONSTRAINT "github_integrations_id_unique" UNIQUE("id");
