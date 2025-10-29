CREATE TABLE "document_embeddings" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"document_vector_store_source_db_id" integer NOT NULL,
	"embedding_profile_id" integer NOT NULL,
	"embedding_dimensions" integer NOT NULL,
	"document_key" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"chunk_content" text NOT NULL,
	"embedding" vector NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "doc_embs_src_prof_doc_chunk_unique" UNIQUE("document_vector_store_source_db_id","embedding_profile_id","document_key","chunk_index")
);
--> statement-breakpoint
ALTER TABLE "document_embeddings" ADD CONSTRAINT "document_embeddings_document_vector_store_source_db_id_document_vector_store_sources_db_id_fk" FOREIGN KEY ("document_vector_store_source_db_id") REFERENCES "public"."document_vector_store_sources"("db_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "doc_embs_embedding_1536_idx" ON "document_embeddings" USING hnsw (("embedding"::vector(1536)) vector_cosine_ops) WHERE "document_embeddings"."embedding_dimensions" = 1536;--> statement-breakpoint
CREATE INDEX "doc_embs_embedding_3072_idx" ON "document_embeddings" USING hnsw (("embedding"::halfvec(3072)) halfvec_cosine_ops) WHERE "document_embeddings"."embedding_dimensions" = 3072;