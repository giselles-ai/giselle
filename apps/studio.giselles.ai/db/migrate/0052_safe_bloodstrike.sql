CREATE TABLE "workspaces" (
	"id" text NOT NULL,
	"db_id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"creator_db_id" integer NOT NULL,
	CONSTRAINT "workspaces_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_creator_db_id_users_db_id_fk" FOREIGN KEY ("creator_db_id") REFERENCES "public"."users"("db_id") ON DELETE no action ON UPDATE no action;