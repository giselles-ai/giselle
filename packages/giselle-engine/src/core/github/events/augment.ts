/**
 * This file adds a new event type to the GitHubEventType enum using
 * TypeScript module augmentation, which helps avoid type errors when
 * adding a new event type that isn't correctly handled everywhere.
 */

import { GitHubEventType } from "./types";

// Declare a module augmentation to extend the GitHubEventType enum
declare module "./types" {
  interface GitHubEventTypeEnumExtensions {
    /**
     * Pull request comment created event
     */
    PULL_REQUEST_COMMENT_CREATED: "pull_request_comment.created";
  }
}

// Export an extension for the GitHubEventType
export const GitHubEventTypeExtensions = {
  PULL_REQUEST_COMMENT_CREATED: "pull_request_comment.created" as const,
};