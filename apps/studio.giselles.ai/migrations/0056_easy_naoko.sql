CREATE TABLE "github_repository_issue_embeddings" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"repository_index_db_id" integer NOT NULL,
	"embedding_profile_id" integer NOT NULL,
	"embedding_dimensions" integer NOT NULL,
	"issue_number" integer NOT NULL,
	"state" text NOT NULL,
	"state_reason" text,
	"issue_updated_at" timestamp NOT NULL,
	"issue_closed_at" timestamp,
	"content_type" text NOT NULL,
	"content_id" text NOT NULL,
	"document_key" text NOT NULL,
	"content_created_at" timestamp NOT NULL,
	"content_edited_at" timestamp,
	"embedding" vector NOT NULL,
	"chunk_content" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gh_issue_emb_unique" UNIQUE("repository_index_db_id","embedding_profile_id","issue_number","content_type","content_id","chunk_index")
);
--> statement-breakpoint
ALTER TABLE "github_repository_issue_embeddings" ADD CONSTRAINT "gh_issue_embeddings_repo_idx_fk" FOREIGN KEY ("repository_index_db_id") REFERENCES "public"."github_repository_index"("db_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gh_issue_embeddings_embedding_1536_idx" ON "github_repository_issue_embeddings" USING hnsw ("embedding"::vector(1536) vector_cosine_ops) WHERE "github_repository_issue_embeddings"."embedding_dimensions" = 1536;--> statement-breakpoint
CREATE INDEX "gh_issue_embeddings_embedding_3072_idx" ON "github_repository_issue_embeddings" USING hnsw ("embedding"::halfvec(3072) halfvec_cosine_ops) WHERE "github_repository_issue_embeddings"."embedding_dimensions" = 3072;--> statement-breakpoint
CREATE INDEX "gh_issue_emb_repo_doc_idx" ON "github_repository_issue_embeddings" USING btree ("repository_index_db_id","document_key");