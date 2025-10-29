CREATE TABLE "document_embedding_profiles" (
	"document_vector_store_db_id" integer NOT NULL,
	"embedding_profile_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "doc_vs_emb_profiles_pk" PRIMARY KEY("document_vector_store_db_id","embedding_profile_id")
);
--> statement-breakpoint
CREATE TABLE "document_vector_stores" (
	"id" text NOT NULL,
	"db_id" serial PRIMARY KEY NOT NULL,
	"team_db_id" integer NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "doc_vs_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "document_embedding_profiles" ADD CONSTRAINT "doc_vs_emb_profiles_store_fk" FOREIGN KEY ("document_vector_store_db_id") REFERENCES "public"."document_vector_stores"("db_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_vector_stores" ADD CONSTRAINT "document_vector_stores_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "doc_vs_team_db_id_idx" ON "document_vector_stores" USING btree ("team_db_id");