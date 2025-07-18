import type {
	githubRepositoryContentStatus,
	githubRepositoryIndex,
} from "@/drizzle";

/**
 * Repository with all its content statuses
 */
export type RepositoryWithStatuses = {
	repository: typeof githubRepositoryIndex.$inferSelect;
	contentStatuses: (typeof githubRepositoryContentStatus.$inferSelect)[];
};
