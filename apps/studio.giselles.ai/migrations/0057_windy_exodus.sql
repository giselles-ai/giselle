ALTER TABLE "github_repository_issue_embeddings" RENAME COLUMN "state" TO "issue_state";--> statement-breakpoint
ALTER TABLE "github_repository_issue_embeddings" RENAME COLUMN "state_reason" TO "issue_state_reason";--> statement-breakpoint
DROP INDEX "gh_issue_embeddings_embedding_1536_idx";--> statement-breakpoint
DROP INDEX "gh_issue_embeddings_embedding_3072_idx";--> statement-breakpoint
CREATE INDEX "gh_issue_embeddings_embedding_1536_idx" ON "github_repository_issue_embeddings" USING hnsw (("embedding"::vector(1536)) vector_cosine_ops) WHERE "github_repository_issue_embeddings"."embedding_dimensions" = 1536;--> statement-breakpoint
CREATE INDEX "gh_issue_embeddings_embedding_3072_idx" ON "github_repository_issue_embeddings" USING hnsw (("embedding"::halfvec(3072)) halfvec_cosine_ops) WHERE "github_repository_issue_embeddings"."embedding_dimensions" = 3072;