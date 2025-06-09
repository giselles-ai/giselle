import { graphql as gql } from "./graphql";
export * from "./blob-loader";
export * from "./document-loader";
export * from "./issues";
export * from "./octokit";
export * from "./repository";
export * from "./tools";
export * from "./types";
export * from "./reactions";
export * from "./webhooks";
export * from "./errors";
export * from "./pull-requests";
export * from "./discussions";

export const IssueNodeIdQuery = gql(/* GraphQL */ `
  query IssueNodeIdQuery($name: String!, $owner: String!, $issueNumber: Int!) {
    repository(name: $name, owner: $owner) {
        issue(number: $issueNumber) {
            id
            title
        }
    }
  }
`);

export const IssueCommentNodeIdQuery = gql(/* GraphQL */ `
  query IssueCommentNodeIdQuery($name: String!, $owner: String!, $issueNumber: Int!) {
    repository(name: $name, owner: $owner) {
        issue(number: $issueNumber) {
            id
            title
            comments(first: 100) {
                nodes {
                    id
                }
            }
        }
    }
  }
`);
