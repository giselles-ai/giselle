import type { VariablesOf } from "gql.tada";
import { graphql } from "./client";
import { graphql as gql } from "./graphql";
import type { GitHubAuthConfig } from "./types";

const AddReactionMutation = gql(/* GraphQL */ `
    mutation addReaction($id: ID!, $content: ReactionContent!) {
        addReaction(input: {subjectId: $id, content: $content}) {
            reaction {
                content
            }
        }
    }
`);
type AddReactionContentMutationVariables = VariablesOf<
	typeof AddReactionMutation
>;

export async function addReaction({
	id,
	content,
	authConfig,
}: AddReactionContentMutationVariables & { authConfig: GitHubAuthConfig }) {
	const client = await graphql(authConfig);
	await client.mutation(AddReactionMutation, { id, content });
}
