ALTER TABLE "agents" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;