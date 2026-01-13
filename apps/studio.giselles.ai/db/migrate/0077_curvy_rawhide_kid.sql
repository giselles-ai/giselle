CREATE TABLE "data_stores" (
	"id" text NOT NULL,
	"db_id" serial PRIMARY KEY NOT NULL,
	"team_db_id" integer NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "data_stores_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "data_stores" ADD CONSTRAINT "data_stores_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "data_stores_team_db_id_idx" ON "data_stores" USING btree ("team_db_id");