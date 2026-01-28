"use server";

import { parseConfiguration } from "@giselles-ai/data-store-registry";
import { type DataStoreId, SecretId } from "@giselles-ai/protocol";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { giselle } from "@/app/giselle";
import { dataStores, db } from "@/db";
import { fetchCurrentTeam } from "@/services/teams";
import type { ActionResult, DataStoreListItem } from "./types";

/**
 * Updates a data store's secret with a new one, with rollback support.
 * Order: 1) create newSecret, 2) updateDataStore, 3) delete oldSecret
 *
 * Rollback strategy:
 * - If updateDataStore fails: delete newSecret (oldSecret still exists)
 * - If oldSecret deletion fails: revert to oldSecret and delete newSecret
 *   (rollback is possible because oldSecret still exists)
 */
async function updateDataStoreWithSecret(
	dataStoreId: DataStoreId,
	oldSecretId: SecretId,
	newSecretLabel: string,
	newSecretValue: string,
): Promise<void> {
	// Step 1: Create new secret
	const newSecret = await giselle.addSecret({
		label: newSecretLabel,
		value: newSecretValue,
		tags: ["data-store"],
	});

	// Step 2: Update data store to use new secret
	// If fails, delete newSecret to prevent orphan
	try {
		await giselle.updateDataStore({
			dataStoreId,
			configuration: {
				connectionStringSecretId: newSecret.id,
			},
		});
	} catch (updateError) {
		await giselle.deleteSecret({ secretId: newSecret.id }).catch((e) => {
			console.error("Failed to rollback new secret:", e);
		});
		throw updateError;
	}

	// Step 3: Delete old secret
	// If fails, revert to old secret and delete new secret to prevent orphan
	try {
		await giselle.deleteSecret({ secretId: oldSecretId });
	} catch (deleteError) {
		try {
			await giselle.updateDataStore({
				dataStoreId,
				configuration: {
					connectionStringSecretId: oldSecretId,
				},
			});
			await giselle.deleteSecret({ secretId: newSecret.id });
		} catch (rollbackError) {
			console.error(
				"Failed to rollback after old secret deletion failure:",
				rollbackError,
			);
		}
		throw deleteError;
	}
}

export async function getDataStores(): Promise<DataStoreListItem[]> {
	const team = await fetchCurrentTeam();

	const stores = await db
		.select({
			id: dataStores.id,
			name: dataStores.name,
			createdAt: dataStores.createdAt,
			updatedAt: dataStores.updatedAt,
		})
		.from(dataStores)
		.where(eq(dataStores.teamDbId, team.dbId))
		.orderBy(dataStores.createdAt);

	return stores;
}

export async function createDataStore(
	name: string,
	connectionString: string,
): Promise<ActionResult> {
	const trimmedName = name.trim();
	if (trimmedName.length === 0) {
		return { success: false, error: "Name is required" };
	}

	const trimmedConnectionString = connectionString.trim();
	if (trimmedConnectionString.length === 0) {
		return { success: false, error: "Connection string is required" };
	}

	try {
		const [team, secret] = await Promise.all([
			fetchCurrentTeam(),
			giselle.addSecret({
				label: `Data Store: ${trimmedName}`,
				value: trimmedConnectionString,
				tags: ["data-store"],
			}),
		]);

		const dataStore = await giselle.createDataStore({
			provider: "postgres",
			configuration: {
				connectionStringSecretId: secret.id,
			},
		});

		await db.insert(dataStores).values({
			id: dataStore.id,
			teamDbId: team.dbId,
			name: trimmedName,
		});

		revalidatePath("/settings/team/data-stores");
		return { success: true };
	} catch (error) {
		console.error("Failed to create data store:", error);
		return {
			success: false,
			error: "Failed to create data store. Please try again.",
		};
	}
}

export async function updateDataStore(
	dataStoreId: DataStoreId,
	name: string,
	connectionString?: string,
): Promise<ActionResult> {
	const trimmedName = name.trim();
	if (trimmedName.length === 0) {
		return { success: false, error: "Name is required" };
	}

	try {
		const team = await fetchCurrentTeam();

		const [existingStore] = await db
			.select({ id: dataStores.id })
			.from(dataStores)
			.where(
				and(eq(dataStores.id, dataStoreId), eq(dataStores.teamDbId, team.dbId)),
			)
			.limit(1);

		if (!existingStore) {
			return { success: false, error: "Data store not found" };
		}

		if (connectionString) {
			const trimmedConnectionString = connectionString.trim();
			if (trimmedConnectionString.length === 0) {
				return { success: false, error: "Connection string is required" };
			}

			const existingDataStore = await giselle.getDataStore({ dataStoreId });
			if (!existingDataStore) {
				return { success: false, error: "Data store configuration not found" };
			}

			const config = parseConfiguration(
				existingDataStore.provider,
				existingDataStore.configuration,
			);
			const oldSecretId = SecretId.parse(config.connectionStringSecretId);

			await updateDataStoreWithSecret(
				dataStoreId,
				oldSecretId,
				`Data Store: ${trimmedName}`,
				trimmedConnectionString,
			);
		}

		try {
			await db
				.update(dataStores)
				.set({ name: trimmedName })
				.where(eq(dataStores.id, dataStoreId));
		} catch (dbError) {
			// We don't rollback here because:
			// 1. oldSecret has already been deleted, so we can't restore the original connection string
			// 2. Rollback could also fail, making the situation worse
			// 3. The data store is functional with the new connection string
			// Instead, we inform the user about the partial success.
			if (connectionString) {
				return {
					success: false,
					error:
						"Connection string was updated successfully, but name update failed. Please try updating the name again.",
				};
			}
			throw dbError;
		}

		revalidatePath("/settings/team/data-stores");
		return { success: true };
	} catch (error) {
		console.error("Failed to update data store:", error);
		return {
			success: false,
			error: "Failed to update data store. Please try again.",
		};
	}
}

export async function deleteDataStore(
	dataStoreId: DataStoreId,
): Promise<ActionResult> {
	try {
		const team = await fetchCurrentTeam();

		const [existingStore] = await db
			.select({ dbId: dataStores.dbId })
			.from(dataStores)
			.where(
				and(eq(dataStores.id, dataStoreId), eq(dataStores.teamDbId, team.dbId)),
			)
			.limit(1);

		if (!existingStore) {
			return { success: false, error: "Data store not found" };
		}

		// Delete DB record first to make it invisible from UI
		await db.delete(dataStores).where(eq(dataStores.id, dataStoreId));

		const existingDataStore = await giselle.getDataStore({ dataStoreId });
		if (existingDataStore) {
			try {
				const config = parseConfiguration(
					existingDataStore.provider,
					existingDataStore.configuration,
				);
				const secretId = SecretId.parse(config.connectionStringSecretId);
				await Promise.all([
					giselle.deleteDataStore({ dataStoreId }),
					giselle.deleteSecret({ secretId }),
				]);
			} catch (e) {
				console.error("Failed to cleanup giselle resources:", e);
			}
		}

		revalidatePath("/settings/team/data-stores");
		return { success: true };
	} catch (error) {
		console.error("Failed to delete data store:", error);
		return {
			success: false,
			error: "Failed to delete data store. Please try again.",
		};
	}
}
