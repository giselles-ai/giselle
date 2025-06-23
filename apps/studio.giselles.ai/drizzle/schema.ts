import type { AgentId } from "@/services/agents/types";
import type {
	GitHubNextAction,
	GitHubTriggerEvent,
} from "@/services/external/github/types";
import type { TeamId } from "@/services/teams/types";
import type { WorkspaceId } from "@giselle-sdk/data-type";
import type {
	FlowId,
	GitHubEventNodeMapping,
	GitHubIntegrationSettingId,
	GitHubRepositoryIndexId,
} from "@giselles-ai/types";
import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
	vector,
} from "drizzle-orm/pg-core";
import type { Stripe } from "stripe";

export const subscriptions = pgTable("subscriptions", {
	// Subscription ID from Stripe, e.g. sub_1234.
	id: text("id").notNull().unique(),
	dbId: serial("db_id").primaryKey(),
	teamDbId: integer("team_db_id")
		.notNull()
		.references(() => teams.dbId, { onDelete: "cascade" }),
	// Customer ID from Stripe, e.g. cus_xxx.
	customerId: text("customer_id"),
	status: text("status").$type<Stripe.Subscription.Status>().notNull(),
	cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull(),
	cancelAt: timestamp("cancel_at"),
	canceledAt: timestamp("canceled_at"),
	currentPeriodStart: timestamp("current_period_start").notNull(),
	currentPeriodEnd: timestamp("current_period_end").notNull(),
	created: timestamp("created").defaultNow().notNull(),
	endedAt: timestamp("ended_at"),
	trialStart: timestamp("trial_start"),
	trialEnd: timestamp("trial_end"),
});

type TeamType = "customer" | "internal";
export const teams = pgTable("teams", {
	id: text("id").$type<TeamId>().notNull().unique(),
	dbId: serial("db_id").primaryKey(),
	name: text("name").notNull(),
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
	(teamMembership) => ({
		teamMembershipsUserTeamUnique: unique().on(
			teamMembership.userDbId,
			teamMembership.teamDbId,
		),
	}),
);

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
	(table) => ({
		teamDbIdIdx: index().on(table.teamDbId),
	}),
);
export const agentsRelations = relations(agents, ({ one }) => ({
	team: one(teams, {
		fields: [agents.teamDbId],
		references: [teams.dbId],
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
	(table) => ({
		oauthCredentialsUserIdProviderProviderAccountIdUnique: unique().on(
			table.userId,
			table.provider,
			table.providerAccountId,
		),
	}),
);

export const githubIntegrationSettings = pgTable(
	"github_integration_settings",
	{
		id: text("id").$type<GitHubIntegrationSettingId>().notNull().unique(),
		agentDbId: integer("agent_db_id")
			.notNull()
			.references(() => agents.dbId),
		dbId: serial("db_id").primaryKey(),
		repositoryFullName: text("repository_full_name").notNull(),
		callSign: text("call_sign").notNull(),
		event: text("event").$type<GitHubTriggerEvent>().notNull(),
		flowId: text("flow_id").$type<FlowId>().notNull(),
		eventNodeMappings: jsonb("event_node_mappings")
			.$type<GitHubEventNodeMapping[]>()
			.notNull(),
		nextAction: text("next_action").$type<GitHubNextAction>().notNull(),
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
	(table) => ({
		agentDbIdIdx: index().on(table.agentDbId),
		endedAtIdx: index().on(table.endedAt),
	}),
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
	(table) => ({
		teamDbIdIdx: index().on(table.teamDbId),
		createdAtIdx: index().on(table.createdAt),
		stripeMeterEventIdIdx: index().on(table.stripeMeterEventId),
	}),
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
		isDelta: boolean("is_delta").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		teamDbIdIdx: index().on(table.teamDbId),
		createdAtIdx: index().on(table.createdAt),
		stripeMeterEventIdIdx: index().on(table.stripeMeterEventId),
	}),
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
	(table) => ({
		teamDbIdIdx: index().on(table.teamDbId),
	}),
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
	(table) => ({
		teamDbIdRevokedAtIdx: index().on(table.teamDbId, table.revokedAt),
	}),
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
		lastIngestedCommitSha: text("last_ingested_commit_sha"),
		status: text("status")
			.notNull()
			.$type<GitHubRepositoryIndexStatus>()
			.default("idle"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => ({
		ownerRepoTeamUnique: unique().on(table.owner, table.repo, table.teamDbId),
		teamDbIdIdx: index().on(table.teamDbId),
		statusIdx: index().on(table.status),
	}),
);

export const githubRepositoryEmbeddings = pgTable(
	"github_repository_embeddings",
	{
		dbId: serial("db_id").primaryKey(),
		repositoryIndexDbId: integer("repository_index_db_id")
			.notNull()
			.references(() => githubRepositoryIndex.dbId, { onDelete: "cascade" }),
		commitSha: text("commit_sha").notNull(),
		fileSha: text("file_sha").notNull(),
		path: text("path").notNull(),
		nodeId: text("node_id").notNull(),
		embedding: vector("embedding", { dimensions: 1536 }).notNull(),
		chunkContent: text("chunk_content").notNull(),
		chunkIndex: integer("chunk_index").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		repositoryIndexDbIdFilePathChunkIndexUnique: unique().on(
			table.repositoryIndexDbId,
			table.path,
			table.chunkIndex,
		),
		embeddingIndex: index().using(
			"hnsw",
			table.embedding.op("vector_cosine_ops"),
		),
	}),
);
