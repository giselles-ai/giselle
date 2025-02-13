CREATE TABLE IF NOT EXISTS "agents" (
	"id" text NOT NULL,
	"db_id" serial PRIMARY KEY NOT NULL,
	"team_db_id" integer NOT NULL,
	"name" text,
	"graph" jsonb DEFAULT '{"nodes":[],"edges":[],"viewport":{"x":0,"y":0,"zoom":1}}'::jsonb NOT NULL,
	"graph_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agents_id_unique" UNIQUE("id"),
	CONSTRAINT "agents_graph_hash_unique" UNIQUE("graph_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "builds" (
	"id" text NOT NULL,
	"db_id" serial PRIMARY KEY NOT NULL,
	"graph" jsonb NOT NULL,
	"graph_hash" text NOT NULL,
	"agent_db_id" integer NOT NULL,
	"before_id" integer,
	"after_id" integer,
	CONSTRAINT "builds_id_unique" UNIQUE("id"),
	CONSTRAINT "builds_graph_hash_unique" UNIQUE("graph_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "edges" (
	"id" text NOT NULL,
	"db_id" serial PRIMARY KEY NOT NULL,
	"build_db_id" integer NOT NULL,
	"target_port_db_id" integer NOT NULL,
	"source_port_db_id" integer NOT NULL,
	CONSTRAINT "edges_target_port_db_id_source_port_db_id_unique" UNIQUE("target_port_db_id","source_port_db_id"),
	CONSTRAINT "edges_id_build_db_id_unique" UNIQUE("id","build_db_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "file_openai_file_representations" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"file_db_id" integer NOT NULL,
	"openai_file_id" text NOT NULL,
	CONSTRAINT "file_openai_file_representations_openai_file_id_unique" UNIQUE("openai_file_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "files" (
	"id" text NOT NULL,
	"db_id" serial PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"blob_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "files_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_content_openai_vector_store_file_representations" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"knowledge_content_db_id" integer NOT NULL,
	"openai_vector_store_file_id" text NOT NULL,
	"openai_vector_store_status" text NOT NULL,
	CONSTRAINT "kcovsfr_knowledge_content_db_id_unique" UNIQUE("knowledge_content_db_id"),
	CONSTRAINT "kcovsfr_openai_vector_store_file_id_unique" UNIQUE("openai_vector_store_file_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_contents" (
	"id" text NOT NULL,
	"db_id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"knowledge_content_type" text NOT NULL,
	"knowledge_db_id" integer NOT NULL,
	"file_db_id" integer NOT NULL,
	CONSTRAINT "knowledge_contents_id_unique" UNIQUE("id"),
	CONSTRAINT "knowledge_contents_file_db_id_knowledge_db_id_unique" UNIQUE("file_db_id","knowledge_db_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_openai_vector_store_representations" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"knowledge_db_id" integer NOT NULL,
	"openai_vector_store_id" text NOT NULL,
	"status" text NOT NULL,
	CONSTRAINT "knowledge_openai_vector_store_representations_openai_vector_store_id_unique" UNIQUE("openai_vector_store_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledges" (
	"id" text NOT NULL,
	"db_id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"agent_db_id" integer NOT NULL,
	CONSTRAINT "knowledges_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nodes" (
	"id" text NOT NULL,
	"db_id" serial PRIMARY KEY NOT NULL,
	"build_db_id" integer NOT NULL,
	"class_name" text NOT NULL,
	"data" jsonb NOT NULL,
	"graph" jsonb NOT NULL,
	CONSTRAINT "nodes_id_build_db_id_unique" UNIQUE("id","build_db_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth_credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp,
	"token_type" text,
	"scope" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_credentials_user_id_provider_provider_account_id_unique" UNIQUE("user_id","provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizations" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ports" (
	"id" text NOT NULL,
	"db_id" serial PRIMARY KEY NOT NULL,
	"node_db_id" integer NOT NULL,
	"name" text NOT NULL,
	"direction" text NOT NULL,
	"type" text NOT NULL,
	CONSTRAINT "ports_id_node_db_id_unique" UNIQUE("id","node_db_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "request_port_messages" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"request_db_id" integer NOT NULL,
	"port_db_id" integer NOT NULL,
	"message" jsonb NOT NULL,
	CONSTRAINT "request_port_messages_request_db_id_port_db_id_unique" UNIQUE("request_db_id","port_db_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "request_results" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"request_db_id" integer NOT NULL,
	"text" text NOT NULL,
	CONSTRAINT "request_results_request_db_id_unique" UNIQUE("request_db_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "request_runners" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"request_db_id" integer NOT NULL,
	"provider" text NOT NULL,
	"runner_id" text NOT NULL,
	CONSTRAINT "request_runners_runner_id_unique" UNIQUE("runner_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "request_stack_runners" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"request_stack_db_id" integer NOT NULL,
	"runner_id" text NOT NULL,
	CONSTRAINT "request_stack_runners_runner_id_unique" UNIQUE("runner_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "request_stacks" (
	"id" text NOT NULL,
	"db_id" serial PRIMARY KEY NOT NULL,
	"request_db_id" integer NOT NULL,
	"start_node_db_id" integer NOT NULL,
	"end_node_db_id" integer NOT NULL,
	CONSTRAINT "request_stacks_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "request_steps" (
	"id" text NOT NULL,
	"db_id" serial PRIMARY KEY NOT NULL,
	"request_stack_db_id" integer NOT NULL,
	"node_db_id" integer NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp,
	"finished_at" timestamp,
	CONSTRAINT "request_steps_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "requests" (
	"id" text NOT NULL,
	"db_id" serial PRIMARY KEY NOT NULL,
	"build_db_id" integer NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"finished_at" timestamp,
	CONSTRAINT "requests_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stripe_user_mappings" (
	"user_db_id" integer NOT NULL,
	"stripe_customer_id" text NOT NULL,
	CONSTRAINT "stripe_user_mappings_user_db_id_unique" UNIQUE("user_db_id"),
	CONSTRAINT "stripe_user_mappings_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" text NOT NULL,
	"db_id" serial PRIMARY KEY NOT NULL,
	"organization_db_id" integer NOT NULL,
	"status" text NOT NULL,
	"cancel_at_period_end" boolean NOT NULL,
	"cancel_at" timestamp,
	"canceled_at" timestamp,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"trial_start" timestamp,
	"trial_end" timestamp,
	CONSTRAINT "subscriptions_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "supabase_user_mappings" (
	"user_db_id" integer NOT NULL,
	"supabase_user_id" text NOT NULL,
	CONSTRAINT "supabase_user_mappings_user_db_id_unique" UNIQUE("user_db_id"),
	CONSTRAINT "supabase_user_mappings_supabase_user_id_unique" UNIQUE("supabase_user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_db_id" integer NOT NULL,
	"team_db_id" integer NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "team_memberships_user_db_id_team_db_id_unique" UNIQUE("user_db_id","team_db_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "teams" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"organization_db_id" integer NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trigger_nodes" (
	"db_id" serial PRIMARY KEY NOT NULL,
	"build_db_id" integer NOT NULL,
	"node_db_id" integer NOT NULL,
	CONSTRAINT "trigger_nodes_build_db_id_unique" UNIQUE("build_db_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text NOT NULL,
	"db_id" serial PRIMARY KEY NOT NULL,
	CONSTRAINT "users_id_unique" UNIQUE("id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agents" ADD CONSTRAINT "agents_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "builds" ADD CONSTRAINT "builds_agent_db_id_agents_db_id_fk" FOREIGN KEY ("agent_db_id") REFERENCES "public"."agents"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "edges" ADD CONSTRAINT "edges_build_db_id_builds_db_id_fk" FOREIGN KEY ("build_db_id") REFERENCES "public"."builds"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "edges" ADD CONSTRAINT "edges_target_port_db_id_ports_db_id_fk" FOREIGN KEY ("target_port_db_id") REFERENCES "public"."ports"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "edges" ADD CONSTRAINT "edges_source_port_db_id_ports_db_id_fk" FOREIGN KEY ("source_port_db_id") REFERENCES "public"."ports"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "file_openai_file_representations" ADD CONSTRAINT "file_openai_file_representations_file_db_id_files_db_id_fk" FOREIGN KEY ("file_db_id") REFERENCES "public"."files"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_content_openai_vector_store_file_representations" ADD CONSTRAINT "knowledge_content_openai_vector_store_file_representations_knowledge_content_db_id_knowledge_contents_db_id_fk" FOREIGN KEY ("knowledge_content_db_id") REFERENCES "public"."knowledge_contents"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_contents" ADD CONSTRAINT "knowledge_contents_knowledge_db_id_knowledges_db_id_fk" FOREIGN KEY ("knowledge_db_id") REFERENCES "public"."knowledges"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_contents" ADD CONSTRAINT "knowledge_contents_file_db_id_files_db_id_fk" FOREIGN KEY ("file_db_id") REFERENCES "public"."files"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledge_openai_vector_store_representations" ADD CONSTRAINT "knowledge_openai_vector_store_representations_knowledge_db_id_knowledges_db_id_fk" FOREIGN KEY ("knowledge_db_id") REFERENCES "public"."knowledges"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "knowledges" ADD CONSTRAINT "knowledges_agent_db_id_agents_db_id_fk" FOREIGN KEY ("agent_db_id") REFERENCES "public"."agents"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nodes" ADD CONSTRAINT "nodes_build_db_id_builds_db_id_fk" FOREIGN KEY ("build_db_id") REFERENCES "public"."builds"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "oauth_credentials" ADD CONSTRAINT "oauth_credentials_user_id_users_db_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ports" ADD CONSTRAINT "ports_node_db_id_nodes_db_id_fk" FOREIGN KEY ("node_db_id") REFERENCES "public"."nodes"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "request_port_messages" ADD CONSTRAINT "request_port_messages_request_db_id_requests_db_id_fk" FOREIGN KEY ("request_db_id") REFERENCES "public"."requests"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "request_port_messages" ADD CONSTRAINT "request_port_messages_port_db_id_ports_db_id_fk" FOREIGN KEY ("port_db_id") REFERENCES "public"."ports"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "request_results" ADD CONSTRAINT "request_results_request_db_id_requests_db_id_fk" FOREIGN KEY ("request_db_id") REFERENCES "public"."requests"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "request_runners" ADD CONSTRAINT "request_runners_request_db_id_requests_db_id_fk" FOREIGN KEY ("request_db_id") REFERENCES "public"."requests"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "request_stack_runners" ADD CONSTRAINT "request_stack_runners_request_stack_db_id_request_stacks_db_id_fk" FOREIGN KEY ("request_stack_db_id") REFERENCES "public"."request_stacks"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "request_stacks" ADD CONSTRAINT "request_stacks_request_db_id_requests_db_id_fk" FOREIGN KEY ("request_db_id") REFERENCES "public"."requests"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "request_stacks" ADD CONSTRAINT "request_stacks_start_node_db_id_nodes_db_id_fk" FOREIGN KEY ("start_node_db_id") REFERENCES "public"."nodes"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "request_stacks" ADD CONSTRAINT "request_stacks_end_node_db_id_nodes_db_id_fk" FOREIGN KEY ("end_node_db_id") REFERENCES "public"."nodes"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "request_steps" ADD CONSTRAINT "request_steps_request_stack_db_id_request_stacks_db_id_fk" FOREIGN KEY ("request_stack_db_id") REFERENCES "public"."request_stacks"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "request_steps" ADD CONSTRAINT "request_steps_node_db_id_nodes_db_id_fk" FOREIGN KEY ("node_db_id") REFERENCES "public"."nodes"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "requests" ADD CONSTRAINT "requests_build_db_id_builds_db_id_fk" FOREIGN KEY ("build_db_id") REFERENCES "public"."builds"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stripe_user_mappings" ADD CONSTRAINT "stripe_user_mappings_user_db_id_users_db_id_fk" FOREIGN KEY ("user_db_id") REFERENCES "public"."users"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_db_id_organizations_db_id_fk" FOREIGN KEY ("organization_db_id") REFERENCES "public"."organizations"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "supabase_user_mappings" ADD CONSTRAINT "supabase_user_mappings_user_db_id_users_db_id_fk" FOREIGN KEY ("user_db_id") REFERENCES "public"."users"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_user_db_id_users_db_id_fk" FOREIGN KEY ("user_db_id") REFERENCES "public"."users"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_team_db_id_teams_db_id_fk" FOREIGN KEY ("team_db_id") REFERENCES "public"."teams"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "teams" ADD CONSTRAINT "teams_organization_db_id_organizations_db_id_fk" FOREIGN KEY ("organization_db_id") REFERENCES "public"."organizations"("db_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trigger_nodes" ADD CONSTRAINT "trigger_nodes_build_db_id_builds_db_id_fk" FOREIGN KEY ("build_db_id") REFERENCES "public"."builds"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trigger_nodes" ADD CONSTRAINT "trigger_nodes_node_db_id_nodes_db_id_fk" FOREIGN KEY ("node_db_id") REFERENCES "public"."nodes"("db_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
