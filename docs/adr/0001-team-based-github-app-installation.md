# ADR 0001: GitHub App Installation Units in studio.giselles.ai

## Context

GitHub integration is a key feature in studio.giselles.ai, allowing teams to connect with their repositories. We need to decide whether GitHub App installations should be managed at the user level or team level.

## Decision

GitHub App installations will be managed at the team level rather than per individual user.

## Status

Proposed

## Current State

Currently, GitHub Integration in studio.giselles.ai appears to be designed with a team-based information structure, but the actual implementation manages integrations on a per-user basis. This creates several inconsistencies:

1. Unnecessary OAuth requirement: Users are required to link their Giselle account with their GitHub account to install the GitHub App. This is not a GitHub requirement but a Giselle-specific one, which adds extra steps to the installation process.

2. Repository visibility inconsistencies within teams: When team members have different GitHub permissions, they see different repositories in GitHub Integration despite being on the same team.

## Consequences

### Risks

There is a risk that GitHub repositories that a user who installed the GitHub App has access to could be viewed and edited through Giselle by other team members who don't have access permissions to those repositories.

## Implementation Plan

1. Update data model to associate GitHub App installations with team IDs rather than user IDs
2. Create a migration script to transform existing user-based integrations to team-based ones
3. Add teamId to `state` query string in GitHub app installation URL (e.g., https://github.com/apps/{org}/installations/new?state={teamId})
4. Add callback page `app/github/apps/installations/callback` to handle the post-installation callback. This page will receive parameters with installationId and teamId as state, save the association to the database, and close the page.
5. Base page will listen for `document.visibilityState` changes and if it changes to `active`, reload data
