-- Drop all tables with CASCADE to handle all dependencies
DROP TABLE "builds" CASCADE;--> statement-breakpoint
DROP TABLE "edges" CASCADE;--> statement-breakpoint
DROP TABLE "file_openai_file_representations" CASCADE;--> statement-breakpoint
DROP TABLE "files" CASCADE;--> statement-breakpoint
DROP TABLE "github_integrations" CASCADE;--> statement-breakpoint
DROP TABLE "knowledge_content_openai_vector_store_file_representations" CASCADE;--> statement-breakpoint
DROP TABLE "knowledge_contents" CASCADE;--> statement-breakpoint
DROP TABLE "knowledge_openai_vector_store_representations" CASCADE;--> statement-breakpoint
DROP TABLE "knowledges" CASCADE;--> statement-breakpoint
DROP TABLE "nodes" CASCADE;--> statement-breakpoint
DROP TABLE "ports" CASCADE;--> statement-breakpoint
DROP TABLE "request_port_messages" CASCADE;--> statement-breakpoint
DROP TABLE "request_results" CASCADE;--> statement-breakpoint
DROP TABLE "request_runners" CASCADE;--> statement-breakpoint
DROP TABLE "request_stack_runners" CASCADE;--> statement-breakpoint
DROP TABLE "request_stacks" CASCADE;--> statement-breakpoint
DROP TABLE "request_steps" CASCADE;--> statement-breakpoint
DROP TABLE "requests" CASCADE;--> statement-breakpoint
DROP TABLE "trigger_nodes" CASCADE;--> statement-breakpoint

-- Alter agents table
ALTER TABLE "agents" DROP CONSTRAINT "agents_graph_hash_unique";--> statement-breakpoint
ALTER TABLE "agents" DROP COLUMN IF EXISTS "graphv2";--> statement-breakpoint
ALTER TABLE "agents" DROP COLUMN IF EXISTS "graph";--> statement-breakpoint
ALTER TABLE "agents" DROP COLUMN IF EXISTS "graph_hash";
