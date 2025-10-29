CREATE TABLE "document_vector_store_sources" (
	"id" text NOT NULL,
	"db_id" serial PRIMARY KEY NOT NULL,
	"document_vector_store_db_id" integer NOT NULL,
	"storage_bucket" text NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"file_checksum" text,
	"upload_status" text DEFAULT 'uploading' NOT NULL,
	"upload_error_code" text,
	"ingest_status" text DEFAULT 'idle' NOT NULL,
	"ingest_error_code" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ingested_at" timestamp,
	CONSTRAINT "doc_vs_src_id_unique" UNIQUE("id"),
	CONSTRAINT "doc_vs_src_storage_unique" UNIQUE("document_vector_store_db_id","storage_key")
);
--> statement-breakpoint
ALTER TABLE "document_vector_store_sources" ADD CONSTRAINT "document_vector_store_sources_document_vector_store_db_id_document_vector_stores_db_id_fk" FOREIGN KEY ("document_vector_store_db_id") REFERENCES "public"."document_vector_stores"("db_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "doc_vs_src_upload_status_idx" ON "document_vector_store_sources" USING btree ("upload_status");--> statement-breakpoint
CREATE INDEX "doc_vs_src_ingest_status_idx" ON "document_vector_store_sources" USING btree ("ingest_status");