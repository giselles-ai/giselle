ALTER TABLE "teams" ADD COLUMN "id" text;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_id_unique" UNIQUE("id");