import type {
	EmbeddingDimensions,
	EmbeddingProfileId,
	FlowTriggerId,
	WorkspaceId,
} from "@giselle-sdk/data-type";
import type { ActId } from "@giselle-sdk/giselle";
import type {
	DocumentVectorStoreId,
	DocumentVectorStoreSourceId,
	GitHubRepositoryIndexId,
} from "@giselles-ai/types";
import { relations, sql } from "drizzle-orm";
import {
	boolean,
	foreignKey,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	primaryKey,
	serial,
	text,
	timestamp,
	unique,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import type { Stripe } from "stripe";
import type { ContentStatusMetadata } from "@/lib/vector-stores/github/types";
import type { AgentId } from "@/services/agents/types";
import type { TeamId } from "@/services/teams/types";
import { vectorWithoutDimensions } from "./custom-types";

export const subscriptions = pgTable("subscriptions", {
	// Subscription ID from Stripe, e.g. sub_1234.
	id: text("id").notNull().unique(),
	dbId: serial("db_id").primaryKey(),
	teamDbId: integer("team_db_id")
		.notNull()
		.references(() => teams.dbId, { onDelete: "cascade" }),
	// Customer ID from Stripe, e.g. cus_xxx.
	customerId: text("customer_id").notNull(),
	status: text("status").$type<Stripe.Subscription.Status>().notNull(),
	cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull(),
	cancelAt: timestamp("cancel_at"),
	canceledAt: timestamp("canceled_at"),

	/**
	 * These fields are removed from the Stripe Subscription object.
	 * - current_period_start
	 * - current_period_end
	 *
	 * But we keep them for compatibility with existing data.
	 * New values are populated from subscriptionItem objects.
	 */
	currentPeriodStart: timestamp("current_period_start").notNull(),
	currentPeriodEnd: timestamp("current_period_end").notNull(),

	created: timestamp("created").defaultNow().notNull(),
	endedAt: timestamp("ended_at"),
	trialStart: timestamp("trial_start"),
	trialEnd: timestamp("trial_end"),
});

export type TeamType = "customer" | "internal";
export const teams = pgTable("teams", {
	id: text("id").$type<TeamId>().notNull().unique(),
	dbId: serial("db_id").primaryKey(),
	name: text("name").notNull(),
	avatarUrl: text("avatar_url"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
	type: text("type").$type<TeamType>().notNull().default("customer"),
});

export type UserId = `usr_${string}`;
export const users = pgTable("users", {
	id: text("id").$type<UserId>().notNull().unique(),
	email: text("email").unique(), // TODO: Allow null values initially when adding schema, then change to not null after data update
	displayName: text("display_name"),
	avatarUrl: text("avatar_url"),
	dbId: serial("db_id").primaryKey(),
});

export const supabaseUserMappings = pgTable("supabase_user_mappings", {
	userDbId: integer("user_db_id")
		.unique()
		.notNull()
		.references(() => users.dbId),
	supabaseUserId: text("supabase_user_id").notNull().unique(),
});

export type TeamRole = "admin" | "member";
export const teamMemberships = pgTable(
	"team_memberships",
	{
		id: serial("id").primaryKey(),
		userDbId: integer("user_db_id")
			.notNull()
			.references(() => users.dbId),
		teamDbId: integer("team_db_id")
			.notNull()
			.references(() => teams.dbId, { onDelete: "cascade" }),
		role: text("role").notNull().$type<TeamRole>(),
	},
	(teamMembership) => [
		unique().on(teamMembership.userDbId, teamMembership.teamDbId),
	],
);

/** @deprecated The agents table does not align with the application domain, so we are migrating to the workspaces table. We are keeping it for gradual migration due to the large scope of impact. */
export const agents = pgTable(
	"agents",
	{
		id: text("id").$type<AgentId>().notNull().unique(),
		dbId: serial("db_id").primaryKey(),
		teamDbId: integer("team_db_id")
			.notNull()
			.references(() => teams.dbId, { onDelete: "cascade" }),
		name: text("name"),
		// TODO: DEPRECATED - graphUrl is legacy field, not used in new architecture, kept only for cleanup of existing data
		graphUrl: text("graph_url"),
		// TODO: add notNull constrain when new architecture released
		workspaceId: text("workspace_id").$type<WorkspaceId>(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
		creatorDbId: integer("creator_db_id")
			.notNull()
			.references(() => users.dbId),
	},
	(table) => [index().on(table.teamDbId)],
);
export const agentsRelations = relations(agents, ({ one }) => ({
	team: one(teams, {
		fields: [agents.teamDbId],
		references: [teams.dbId],
	}),
}));

export const workspaces = pgTable("workspaces", {
	id: text("id").$type<WorkspaceId>().notNull().unique(),
	dbId: serial("db_id").primaryKey(),
	name: text("name"),
	teamDbId: integer("team_db_id")
		.notNull()
		.references(() => teams.dbId, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
	creatorDbId: integer("creator_db_id")
		.notNull()
		.references(() => users.dbId),
});

export const workspaceRelations = relations(workspaces, ({ one }) => ({
	creator: one(users, {
		fields: [workspaces.creatorDbId],
		references: [users.dbId],
	}),
}));

export const oauthCredentials = pgTable(
	"oauth_credentials",
	{
		id: serial("id").primaryKey(),
		userId: integer("user_id")
			.notNull()
			.references(() => users.dbId),
		provider: text("provider").notNull(),
		providerAccountId: text("provider_account_id").notNull(),
		accessToken: text("access_token").notNull(),
		refreshToken: text("refresh_token"),
		expiresAt: timestamp("expires_at"),
		tokenType: text("token_type"),
		scope: text("scope"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => [
		unique().on(table.userId, table.provider, table.providerAccountId),
	],
);

/** @deprecated */
export const githubIntegrationSettings = pgTable(
	"github_integration_settings",
	{
		id: text("id").notNull().unique(),
		agentDbId: integer("agent_db_id")
			.notNull()
			.references(() => agents.dbId),
		dbId: serial("db_id").primaryKey(),
		repositoryFullName: text("repository_full_name").notNull(),
		callSign: text("call_sign").notNull(),
		event: text("event").notNull(),
		flowId: text("flow_id").notNull(),
		eventNodeMappings: jsonb("event_node_mappings").notNull(),
		nextAction: text("next_action").notNull(),
	},
);

export const agentActivities = pgTable(
	"agent_activities",
	{
		dbId: serial("db_id").primaryKey(),
		agentDbId: integer("agent_db_id")
			.notNull()
			.references(() => agents.dbId, { onDelete: "cascade" }),
		startedAt: timestamp("started_at").notNull(),
		endedAt: timestamp("ended_at").notNull(),
		totalDurationMs: numeric("total_duration_ms").notNull(),
		usageReportDbId: integer("usage_report_db_id").references(
			() => agentTimeUsageReports.dbId,
		),
	},
	(table) => [index().on(table.agentDbId), index().on(table.endedAt)],
);

export const agentTimeUsageReports = pgTable(
	"agent_time_usage_reports",
	{
		dbId: serial("db_id").primaryKey(),
		teamDbId: integer("team_db_id")
			.notNull()
			.references(() => teams.dbId, { onDelete: "cascade" }),
		accumulatedDurationMs: numeric("accumulated_duration_ms").notNull(),
		minutesIncrement: integer("minutes_increment").notNull(),
		stripeMeterEventId: text("stripe_meter_event_id").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index().on(table.teamDbId),
		index().on(table.createdAt),
		index().on(table.stripeMeterEventId),
	],
);

export const userSeatUsageReports = pgTable(
	"user_seat_usage_reports",
	{
		dbId: serial("db_id").primaryKey(),
		teamDbId: integer("team_db_id")
			.notNull()
			.references(() => teams.dbId, { onDelete: "cascade" }),
		// Keep snapshot for audit purposes
		userDbIdList: integer("user_db_id_list").array().notNull(),
		stripeMeterEventId: text("stripe_meter_event_id").notNull(),
		value: integer("value").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index().on(table.teamDbId),
		index().on(table.createdAt),
		index().on(table.stripeMeterEventId),
	],
);

export const agentTimeRestrictions = pgTable(
	"agent_time_restrictions",
	{
		teamDbId: integer("team_db_id")
			.notNull()
			.references(() => teams.dbId, { onDelete: "cascade" })
			.primaryKey(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index().on(table.teamDbId)],
);

export const invitations = pgTable(
	"invitations",
	{
		token: text("token").notNull().unique(),
		teamDbId: integer("team_db_id")
			.notNull()
			.references(() => teams.dbId, { onDelete: "cascade" }),
		email: text("email").notNull(),
		role: text("role").notNull().$type<TeamRole>(),
		inviterUserDbId: integer("inviter_user_db_id")
			.notNull()
			.references(() => users.dbId, { onDelete: "cascade" }),
		expiredAt: timestamp("expired_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		revokedAt: timestamp("revoked_at"),
	},
	(table) => [index().on(table.teamDbId, table.revokedAt)],
);

export type GitHubRepositoryIndexStatus =
	| "idle"
	| "running"
	| "completed"
	| "failed";
export const githubRepositoryIndex = pgTable(
	"github_repository_index",
	{
		id: text("id").$type<GitHubRepositoryIndexId>().notNull().unique(),
		dbId: serial("db_id").primaryKey(),
		owner: text("owner").notNull(),
		repo: text("repo").notNull(),
		teamDbId: integer("team_db_id")
			.notNull()
			.references(() => teams.dbId, { onDelete: "cascade" }),
		installationId: integer("installation_id").notNull(),
		/** @deprecated Use githubRepositoryContentStatus table instead */
		lastIngestedCommitSha: text("last_ingested_commit_sha"),
		/** @deprecated Use githubRepositoryContentStatus table instead */
		status: text("status")
			.notNull()
			.$type<GitHubRepositoryIndexStatus>()
			.default("idle"),
		/** @deprecated Use githubRepositoryContentStatus table instead */
		errorCode: text("error_code"),
		/** @deprecated Use githubRepositoryContentStatus table instead */
		retryAfter: timestamp("retry_after"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		unique().on(table.owner, table.repo, table.teamDbId),
		index().on(table.teamDbId),
		index().on(table.status),
	],
);

export const githubRepositoryEmbeddingProfiles = pgTable(
	"github_repository_embedding_profiles",
	{
		repositoryIndexDbId: integer("repository_index_db_id").notNull(),
		embeddingProfileId: integer("embedding_profile_id")
			.$type<EmbeddingProfileId>()
			.notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.repositoryIndexDbId, table.embeddingProfileId],
			name: "gh_repo_emb_profiles_pk",
		}),
		foreignKey({
			columns: [table.repositoryIndexDbId],
			foreignColumns: [githubRepositoryIndex.dbId],
			name: "gh_repo_emb_profiles_repo_idx_fk",
		}).onDelete("cascade"),
	],
);

export const documentVectorStores = pgTable(
	"document_vector_stores",
	{
		id: text("id").$type<DocumentVectorStoreId>().notNull(),
		dbId: serial("db_id").primaryKey(),
		teamDbId: integer("team_db_id")
			.notNull()
			.references(() => teams.dbId, { onDelete: "cascade" }),
		name: text("name").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("doc_vs_team_db_id_idx").on(table.teamDbId),
		unique("doc_vs_id_unique").on(table.id),
	],
);

export type DocumentVectorStoreSourceUploadStatus =
	| "uploading"
	| "uploaded"
	| "failed";

export type DocumentVectorStoreSourceIngestStatus =
	| "idle"
	| "running"
	| "completed"
	| "failed";

export const documentVectorStoreSources = pgTable(
	"document_vector_store_sources",
	{
		id: text("id").$type<DocumentVectorStoreSourceId>().notNull(),
		dbId: serial("db_id").primaryKey(),
		documentVectorStoreDbId: integer("document_vector_store_db_id")
			.notNull()
			.references(() => documentVectorStores.dbId, { onDelete: "cascade" }),
		storageBucket: text("storage_bucket").notNull(),
		storageKey: text("storage_key").notNull(),
		fileName: text("file_name").notNull(),
		fileSizeBytes: integer("file_size_bytes").notNull(),
		fileChecksum: text("file_checksum"),
		uploadStatus: text("upload_status")
			.notNull()
			.$type<DocumentVectorStoreSourceUploadStatus>()
			.default("uploading"),
		uploadErrorCode: text("upload_error_code"),
		ingestStatus: text("ingest_status")
			.notNull()
			.$type<DocumentVectorStoreSourceIngestStatus>()
			.default("idle"),
		ingestErrorCode: text("ingest_error_code"),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
		ingestedAt: timestamp("ingested_at"),
	},
	(table) => [
		unique("doc_vs_src_id_unique").on(table.id),
		unique("doc_vs_src_storage_unique").on(
			table.documentVectorStoreDbId,
			table.storageKey,
		),
		index("doc_vs_src_upload_status_idx").on(table.uploadStatus),
		index("doc_vs_src_ingest_status_idx").on(table.ingestStatus),
	],
);

export const documentVectorStoreSourcesRelations = relations(
	documentVectorStoreSources,
	({ one }) => ({
		documentVectorStore: one(documentVectorStores, {
			fields: [documentVectorStoreSources.documentVectorStoreDbId],
			references: [documentVectorStores.dbId],
		}),
	}),
);

export const documentEmbeddingProfiles = pgTable(
	"document_embedding_profiles",
	{
		documentVectorStoreDbId: integer("document_vector_store_db_id").notNull(),
		embeddingProfileId: integer("embedding_profile_id")
			.$type<EmbeddingProfileId>()
			.notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.documentVectorStoreDbId, table.embeddingProfileId],
			name: "doc_vs_emb_profiles_pk",
		}),
		foreignKey({
			columns: [table.documentVectorStoreDbId],
			foreignColumns: [documentVectorStores.dbId],
			name: "doc_vs_emb_profiles_store_fk",
		}).onDelete("cascade"),
	],
);

export const documentEmbeddings = pgTable(
	"document_embeddings",
	{
		dbId: serial("db_id").primaryKey(),
		documentVectorStoreDbId: integer("document_vector_store_db_id")
			.notNull()
			.references(() => documentVectorStores.dbId, {
				onDelete: "cascade",
			}),
		documentVectorStoreSourceDbId: integer("document_vector_store_source_db_id")
			.notNull()
			.references(() => documentVectorStoreSources.dbId, {
				onDelete: "cascade",
			}),
		embeddingProfileId: integer("embedding_profile_id")
			.$type<EmbeddingProfileId>()
			.notNull(),
		embeddingDimensions: integer("embedding_dimensions")
			.$type<EmbeddingDimensions>()
			.notNull(),
		documentKey: text("document_key").notNull(),
		chunkIndex: integer("chunk_index").notNull(),
		chunkContent: text("chunk_content").notNull(),
		embedding: vectorWithoutDimensions("embedding").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		unique("doc_embs_src_prof_doc_chunk_unique").on(
			table.documentVectorStoreSourceDbId,
			table.embeddingProfileId,
			table.documentKey,
			table.chunkIndex,
		),
		index("doc_embs_embedding_1536_idx")
			.using("hnsw", sql`(${table.embedding}::vector(1536)) vector_cosine_ops`)
			.where(sql`${table.embeddingDimensions} = 1536`),
		index("doc_embs_embedding_3072_idx")
			.using(
				"hnsw",
				sql`(${table.embedding}::halfvec(3072)) halfvec_cosine_ops`,
			)
			.where(sql`${table.embeddingDimensions} = 3072`),
		index("doc_embs_store_idx").on(table.documentVectorStoreDbId),
	],
);

export const documentEmbeddingsRelations = relations(
	documentEmbeddings,
	({ one }) => ({
		documentVectorStoreSource: one(documentVectorStoreSources, {
			fields: [documentEmbeddings.documentVectorStoreSourceDbId],
			references: [documentVectorStoreSources.dbId],
		}),
		documentVectorStore: one(documentVectorStores, {
			fields: [documentEmbeddings.documentVectorStoreDbId],
			references: [documentVectorStores.dbId],
		}),
	}),
);

export type GitHubRepositoryContentType = "blob" | "pull_request" | "issue";
export const githubRepositoryContentStatus = pgTable(
	"github_repository_content_status",
	{
		dbId: serial("db_id").primaryKey(),
		repositoryIndexDbId: integer("repository_index_db_id").notNull(),
		embeddingProfileId: integer("embedding_profile_id")
			.$type<EmbeddingProfileId>()
			.notNull(),
		contentType: text("content_type")
			.$type<GitHubRepositoryContentType>()
			.notNull(),
		enabled: boolean("enabled").notNull().default(true),
		status: text("status")
			.notNull()
			.$type<GitHubRepositoryIndexStatus>()
			.default("idle"),
		lastSyncedAt: timestamp("last_synced_at"),
		metadata: jsonb("metadata").$type<ContentStatusMetadata>(),
		errorCode: text("error_code"),
		retryAfter: timestamp("retry_after"),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		unique("gh_content_status_unique").on(
			table.repositoryIndexDbId,
			table.embeddingProfileId,
			table.contentType,
		),
		foreignKey({
			columns: [table.repositoryIndexDbId],
			foreignColumns: [githubRepositoryIndex.dbId],
			name: "gh_content_status_repo_idx_fk",
		}).onDelete("cascade"),
		index("gh_content_status_query_idx").on(
			table.enabled,
			table.status,
			table.updatedAt,
			table.retryAfter,
		),
	],
);

export const githubRepositoryEmbeddings = pgTable(
	"github_repository_embeddings",
	{
		dbId: serial("db_id").primaryKey(),
		repositoryIndexDbId: integer("repository_index_db_id")
			.notNull()
			.references(() => githubRepositoryIndex.dbId, { onDelete: "cascade" }),
		embeddingProfileId: integer("embedding_profile_id")
			.$type<EmbeddingProfileId>()
			.notNull(),
		embeddingDimensions: integer("embedding_dimensions")
			.$type<EmbeddingDimensions>()
			.notNull(),
		fileSha: text("file_sha").notNull(),
		path: text("path").notNull(),
		embedding: vectorWithoutDimensions("embedding").notNull(),
		chunkContent: text("chunk_content").notNull(),
		chunkIndex: integer("chunk_index").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		unique("gh_repo_emb_unique").on(
			table.repositoryIndexDbId,
			table.embeddingProfileId,
			table.path,
			table.chunkIndex,
		),
		// Partial HNSW indexes for different dimensions with casting
		index("github_repository_embeddings_embedding_1536_idx")
			.using("hnsw", sql`${table.embedding}::vector(1536) vector_cosine_ops`)
			.where(sql`${table.embeddingDimensions} = 1536`),
		index("github_repository_embeddings_embedding_3072_idx")
			.using("hnsw", sql`${table.embedding}::halfvec(3072) halfvec_cosine_ops`)
			.where(sql`${table.embeddingDimensions} = 3072`),
	],
);

export const GitHubRepositoryPullRequestContentTypeValues = [
	"title_body",
	"comment",
	"diff",
] as const;
export type GitHubRepositoryPullRequestContentType =
	(typeof GitHubRepositoryPullRequestContentTypeValues)[number];
// Document key format for GitHub Pull Request embeddings (e.g., "123:title_body:", "123:comment:456", "123:diff:path/to/file.ts")
export type GitHubPullRequestDocumentKey =
	`${number}:${GitHubRepositoryPullRequestContentType}:${string}`;

export const githubRepositoryPullRequestEmbeddings = pgTable(
	"github_repository_pull_request_embeddings",
	{
		dbId: serial("db_id").primaryKey(),
		repositoryIndexDbId: integer("repository_index_db_id").notNull(),
		embeddingProfileId: integer("embedding_profile_id")
			.$type<EmbeddingProfileId>()
			.notNull(),
		embeddingDimensions: integer("embedding_dimensions")
			.$type<EmbeddingDimensions>()
			.notNull(),
		prNumber: integer("pr_number").notNull(),
		mergedAt: timestamp("merged_at").notNull(),
		contentType: text("content_type")
			.$type<GitHubRepositoryPullRequestContentType>()
			.notNull(),
		contentId: text("content_id").notNull(),
		documentKey: text("document_key")
			.$type<GitHubPullRequestDocumentKey>()
			.notNull(),
		embedding: vectorWithoutDimensions("embedding").notNull(),
		chunkContent: text("chunk_content").notNull(),
		chunkIndex: integer("chunk_index").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		unique("gh_pr_emb_unique").on(
			table.repositoryIndexDbId,
			table.embeddingProfileId,
			table.prNumber,
			table.contentType,
			table.contentId,
			table.chunkIndex,
		),
		// Partial HNSW indexes for different dimensions with casting
		index("gh_pr_embeddings_embedding_1536_idx")
			.using("hnsw", sql`${table.embedding}::vector(1536) vector_cosine_ops`)
			.where(sql`${table.embeddingDimensions} = 1536`),
		index("gh_pr_embeddings_embedding_3072_idx")
			.using("hnsw", sql`${table.embedding}::halfvec(3072) halfvec_cosine_ops`)
			.where(sql`${table.embeddingDimensions} = 3072`),
		foreignKey({
			columns: [table.repositoryIndexDbId],
			foreignColumns: [githubRepositoryIndex.dbId],
			name: "gh_pr_embeddings_repo_idx_fk",
		}).onDelete("cascade"),
		index("gh_pr_emb_repo_doc_idx").on(
			table.repositoryIndexDbId,
			table.documentKey,
		),
	],
);

export const GitHubIssueStateValues = ["OPEN", "CLOSED"] as const;
export type GitHubIssueState = (typeof GitHubIssueStateValues)[number];

export const GitHubIssueStateReasonValues = [
	"COMPLETED",
	"DUPLICATE",
	"NOT_PLANNED",
	"REOPENED",
] as const;
export type GitHubIssueStateReason =
	(typeof GitHubIssueStateReasonValues)[number];

export const GitHubRepositoryIssueContentTypeValues = [
	"title_body",
	"comment",
] as const;
export type GitHubRepositoryIssueContentType =
	(typeof GitHubRepositoryIssueContentTypeValues)[number];

export type GitHubIssueDocumentKey =
	`${number}:${GitHubRepositoryIssueContentType}:${string}`;

export const githubRepositoryIssueEmbeddings = pgTable(
	"github_repository_issue_embeddings",
	{
		dbId: serial("db_id").primaryKey(),
		repositoryIndexDbId: integer("repository_index_db_id").notNull(),
		embeddingProfileId: integer("embedding_profile_id")
			.$type<EmbeddingProfileId>()
			.notNull(),
		embeddingDimensions: integer("embedding_dimensions")
			.$type<EmbeddingDimensions>()
			.notNull(),
		issueNumber: integer("issue_number").notNull(),
		state: text("state").$type<GitHubIssueState>().notNull(),
		stateReason: text("state_reason").$type<GitHubIssueStateReason | null>(),
		issueUpdatedAt: timestamp("issue_updated_at").notNull(),
		issueClosedAt: timestamp("issue_closed_at"),
		contentType: text("content_type")
			.$type<GitHubRepositoryIssueContentType>()
			.notNull(),
		contentId: text("content_id").notNull(),
		documentKey: text("document_key").$type<GitHubIssueDocumentKey>().notNull(),
		contentCreatedAt: timestamp("content_created_at").notNull(),
		contentEditedAt: timestamp("content_edited_at"),
		embedding: vectorWithoutDimensions("embedding").notNull(),
		chunkContent: text("chunk_content").notNull(),
		chunkIndex: integer("chunk_index").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		unique("gh_issue_emb_unique").on(
			table.repositoryIndexDbId,
			table.embeddingProfileId,
			table.issueNumber,
			table.contentType,
			table.contentId,
			table.chunkIndex,
		),
		index("gh_issue_embeddings_embedding_1536_idx")
			.using("hnsw", sql`(${table.embedding}::vector(1536)) vector_cosine_ops`)
			.where(sql`${table.embeddingDimensions} = 1536`),
		index("gh_issue_embeddings_embedding_3072_idx")
			.using("hnsw", sql`(${table.embedding}::halfvec(3072)) halfvec_cosine_ops`)
			.where(sql`${table.embeddingDimensions} = 3072`),
		foreignKey({
			columns: [table.repositoryIndexDbId],
			foreignColumns: [githubRepositoryIndex.dbId],
			name: "gh_issue_embeddings_repo_idx_fk",
		}).onDelete("cascade"),
		index("gh_issue_emb_repo_doc_idx").on(
			table.repositoryIndexDbId,
			table.documentKey,
		),
	],
);

export const flowTriggers = pgTable(
	"flow_triggers",
	{
		dbId: serial("db_id").primaryKey(),
		teamDbId: integer("team_db_id")
			.notNull()
			.references(() => teams.dbId, { onDelete: "cascade" }),
		staged: boolean("staged").notNull().default(false),
		sdkWorkspaceId: text("workspace_id").$type<WorkspaceId>().notNull(),
		sdkFlowTriggerId: text("flow_trigger_id").$type<FlowTriggerId>().notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		uniqueIndex().on(table.sdkFlowTriggerId),
		index().on(table.teamDbId),
		index().on(table.staged),
	],
);

export const acts = pgTable(
	"acts",
	{
		dbId: serial("db_id").primaryKey(),
		teamDbId: integer("team_db_id")
			.notNull()
			.references(() => teams.dbId, { onDelete: "cascade" }),
		directorDbId: integer("director_db_id")
			.notNull()
			.references(() => users.dbId, { onDelete: "cascade" }),
		sdkWorkspaceId: text("sdk_workspace_id").$type<WorkspaceId>().notNull(),
		sdkFlowTriggerId: text("sdk_flow_trigger_id")
			.$type<FlowTriggerId>()
			.notNull(),
		sdkActId: text("sdk_act_id").$type<ActId>().notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index().on(table.teamDbId),
		index().on(table.sdkWorkspaceId),
		index().on(table.sdkFlowTriggerId),
		index().on(table.sdkActId),
	],
);

export const actRelations = relations(acts, ({ one }) => ({
	team: one(teams, {
		fields: [acts.teamDbId],
		references: [teams.dbId],
	}),
}));
