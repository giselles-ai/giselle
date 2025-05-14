CREATE TABLE IF NOT EXISTS "github_repository_embeddings" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"repository_index_db_id" integer NOT NULL,
	"commit_sha" text NOT NULL,
	"file_sha" text NOT NULL,
	"path" text NOT NULL,
	"node_id" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"chunk_content" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "github_repository_embeddings_repository_index_db_id_path_chunk_index_unique" UNIQUE("repository_index_db_id","path","chunk_index")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "github_repository_index" (
	"id" text NOT NULL,
	"db_id" serial PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"repo" text NOT NULL,
	"team_db_id" integer NOT NULL,
	"installation_id" integer NOT NULL,
	"last_ingested_commit_sha" text,
	"status" text DEFAULT 'idle' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "github_repository_index_id_unique" UNIQUE("id"),
	CONSTRAINT "github_repository_index_owner_repo_team_db_id_unique" UNIQUE("owner","repo","team_db_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_repository_embeddings" ADD CONSTRAINT "github_repository_embeddings_repository_index_db_id_github_repository_index_db_id_fk" FOREIGN KEY ("repository_index_db_id") REFERENCES "public"."github_repository_index"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_repository_index" ADD CONSTRAINT "github_repository_index_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_repository_embeddings_embedding_index" ON "github_repository_embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_repository_index_team_db_id_index" ON "github_repository_index" USING btree ("team_db_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_repository_index_status_index" ON "github_repository_index" USING btree ("status");