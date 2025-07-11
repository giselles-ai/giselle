import * as v from "valibot";

export const signupSchema = v.object({
	email: v.pipe(
		v.string("Email is required"),
		v.minLength(1, "Email is required"),
		v.maxLength(254, "Email address is too long"),
		v.email("Email address is not valid"),
	),
	password: v.pipe(
		v.string("Password is required"),
		v.minLength(6, "Password must be at least 6 characters"),
	),
});

type SignupForm = v.InferOutput<typeof signupSchema>;

export type ValidationErrors = {
	[K in keyof SignupForm]?: string;
};
