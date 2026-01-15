"use server";

import { parseConfiguration } from "@giselles-ai/data-store-registry";
import { type DataStoreId, SecretId } from "@giselles-ai/protocol";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { giselle } from "@/app/giselle";
import { dataStores, db } from "@/db";
import { fetchCurrentTeam } from "@/services/teams";
import type { ActionResult, DataStoreListItem } from "./types";

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

		if (connectionString && connectionString.trim().length > 0) {
			const trimmedConnectionString = connectionString.trim();

			const existingDataStore = await giselle.getDataStore({ dataStoreId });
			if (!existingDataStore) {
				return { success: false, error: "Data store configuration not found" };
			}

			const config = parseConfiguration(
				existingDataStore.provider,
				existingDataStore.configuration,
			);

			const newSecret = await giselle.addSecret({
				label: `Data Store: ${trimmedName}`,
				value: trimmedConnectionString,
				tags: ["data-store"],
			});

			await giselle.updateDataStore({
				dataStoreId,
				configuration: {
					connectionStringSecretId: newSecret.id,
				},
			});

			const parseResult = SecretId.safeParse(config.connectionStringSecretId);
			if (parseResult.success) {
				await giselle
					.deleteSecret({ secretId: parseResult.data })
					.catch((e) => {
						console.error("Failed to delete old secret:", e);
					});
			}
		}

		await db
			.update(dataStores)
			.set({ name: trimmedName })
			.where(eq(dataStores.id, dataStoreId));

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

		const existingDataStore = await giselle.getDataStore({ dataStoreId });
		if (existingDataStore) {
			// Delete the secret
			const config = parseConfiguration(
				existingDataStore.provider,
				existingDataStore.configuration,
			);
			const parseResult = SecretId.safeParse(config.connectionStringSecretId);
			if (parseResult.success) {
				await giselle.deleteSecret({ secretId: parseResult.data });
			}

			await giselle.deleteDataStore({ dataStoreId });
		}

		await db.delete(dataStores).where(eq(dataStores.id, dataStoreId));

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
