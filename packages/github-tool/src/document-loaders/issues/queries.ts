import { graphql } from "../../graphql";

export const GetIssuesMetadataQuery = graphql(`
	query GetIssuesMetadata(
		$owner: String!
		$repo: String!
		$first: Int!
		$after: String
	) {
		repository(owner: $owner, name: $repo) {
			issues(
				first: $first
				after: $after
				orderBy: { field: CREATED_AT, direction: DESC }
			) {
				nodes {
					number
					lastEditedAt
					state
					stateReason
					createdAt
					updatedAt
					closedAt
					comments(last: 100) {
						nodes {
							id
							createdAt
							lastEditedAt
							author {
								__typename
							}
						}
					}
				}
				pageInfo {
					hasNextPage
					endCursor
				}
			}
		}
	}
`);

export const GetIssueDetailsQuery = graphql(`
	query GetIssueDetails(
		$owner: String!
		$repo: String!
		$number: Int!
	) {
		repository(owner: $owner, name: $repo) {
			issue(number: $number) {
				title
				body
				comments(last: 100) {
					nodes {
						id
						body
						author {
							__typename
						}
					}
				}
			}
		}
	}
`);
