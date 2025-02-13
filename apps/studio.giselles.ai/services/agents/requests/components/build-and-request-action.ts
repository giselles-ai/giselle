"use server";

export type BuildAndRequestActionError = {
	type: "unexpected-error";
};

export const buildAndRequestAction = async (
	prevState: BuildAndRequestActionError | null,
	formData: FormData,
) => {
	formData.get("");
};
