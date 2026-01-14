"use server";

import { giselle } from "@/app/giselle";

export async function createDataStore(
	input: Parameters<typeof giselle.createDataStore>[0],
) {
	return { dataStore: await giselle.createDataStore(input) };
}

export async function getDataStore(
	input: Parameters<typeof giselle.getDataStore>[0],
) {
	return { dataStore: await giselle.getDataStore(input) };
}

export async function updateDataStore(
	input: Parameters<typeof giselle.updateDataStore>[0],
) {
	await giselle.updateDataStore(input);
}

export async function deleteDataStore(
	input: Parameters<typeof giselle.deleteDataStore>[0],
) {
	await giselle.deleteDataStore(input);
}
