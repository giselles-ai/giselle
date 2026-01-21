"use server";

import type {
	QueuedGeneration,
	Trigger,
	TriggerId,
} from "@giselles-ai/protocol";
import { DatabaseError } from "pg";
import { giselle } from "@/app/giselle";

export async function resolveTrigger(input: { generation: QueuedGeneration }) {
	return { trigger: await giselle.resolveTrigger(input) };
}

export async function configureTrigger(
	input: Parameters<typeof giselle.configureTrigger>[0],
) {
	return { triggerId: await giselle.configureTrigger(input) };
}

export async function getTrigger(input: { triggerId: TriggerId }) {
	return { trigger: await giselle.getTrigger(input) };
}

export async function setTrigger(input: { trigger: Trigger }) {
	return { triggerId: await giselle.setTrigger(input) };
}

export async function reconfigureGitHubTrigger(
	input: Parameters<typeof giselle.reconfigureGitHubTrigger>[0],
) {
	return { triggerId: await giselle.reconfigureGitHubTrigger(input) };
}

export async function executeAction(input: { generation: QueuedGeneration }) {
	await giselle.executeAction(input);
}

export async function executeQuery(input: { generation: QueuedGeneration }) {
	await giselle.executeQuery(input.generation);
}

export async function executeDataQuery(input: {
	generation: QueuedGeneration;
}) {
	try {
		await giselle.executeDataQuery(input.generation);
	} catch (error) {
		if (error instanceof DatabaseError) {
			// PostgreSQL errors (syntax errors, missing tables, etc.) are expected user errors.
			// The generation status is already persisted as "failed" by execute-data-query.ts.
			// Don't re-throw to avoid Sentry noise from user-initiated errors.
			return;
		}
		// Other errors (network, configuration, etc.) should go to Sentry
		throw error;
	}
}

export async function getGitHubRepositoryFullname(
	input: Parameters<typeof giselle.getGitHubRepositoryFullname>[0],
) {
	return { fullname: await giselle.getGitHubRepositoryFullname(input) };
}
