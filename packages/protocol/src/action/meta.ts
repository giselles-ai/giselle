import z from "zod/v4";

export const actionMetadataRegistory = z.registry<{
	label: string;
}>();
