import { graphql } from "../../graphql";

export const GetPullRequestsMetadataQuery = graphql(`
	query GetPullRequestsMetadata(
		$owner: String!
		$repo: String!
		$first: Int!
		$after: String
	) {
		repository(owner: $owner, name: $repo) {
			pullRequests(
				states: MERGED
				first: $first
				after: $after
				orderBy: { field: CREATED_AT, direction: DESC }
			) {
				nodes {
					number
					mergedAt
					comments(last: 100) {
						nodes {
							id
							author {
								__typename
							}
						}
					}
					files(first: 100) {
						nodes {
							path
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

export const GetPullRequestDetailsQuery = graphql(`
	query GetPullRequestDetails(
		$owner: String!
		$repo: String!
		$number: Int!
	) {
		repository(owner: $owner, name: $repo) {
			pullRequest(number: $number) {
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
				headCommit: commits(last: 1) {
					nodes {
						commit {
							tree {
								entries {
									path
									isGenerated
									extension
									lineCount
									object {
										... on Blob {
											byteSize
											isBinary
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
`);
