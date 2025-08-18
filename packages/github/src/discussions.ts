import { graphql } from "./client";
import { graphql as gql } from "./graphql";
import type { GitHubAuthConfig } from "./types";

const DiscussionQuery = gql(/* GraphQL */ `
    query DiscussionQuery($owner: String!, $name: String!, $number: Int!) {
        repository(owner: $owner, name: $name) {
            discussion(number: $number) {
                id
                number
                title
                comments(first: 100) {
                    totalCount
                    nodes {
                        body
                        author {
                            avatarUrl
                            login
                        }
                        replies(first: 100) {
                            nodes {
                                body
                                author {
                                    avatarUrl
                                    login
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`);

export async function getDiscussion({
	owner,
	name,
	number,
	authConfig,
}: {
	owner: string;
	name: string;
	number: number;
	authConfig: GitHubAuthConfig;
}) {
	const client = await graphql(authConfig);

	return await client.query(DiscussionQuery, { owner, name, number });
}
