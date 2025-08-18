import type { components } from "@octokit/openapi-types";
import { graphql } from "./client";
import { graphql as gql } from "./graphql";
import type { GitHubAuthConfig } from "./types";

export type Repository = components["schemas"]["repository"];

const query = gql(/* GraphQL */ `
    query RepositoryNodeIdQuery($id: ID!) {
        node(id: $id) {
            ... on Repository {
            owner {
                login
            }
            name
            }
        }
    }
`);

export async function getRepositoryFullname(
	nodeId: string,
	authConfig: GitHubAuthConfig,
) {
	const client = await graphql(authConfig);

	return await client.query(query, {
		id: nodeId,
	});
}
