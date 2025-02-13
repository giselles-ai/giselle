// "use server";

// import { db, supabaseUserMappings, userInitialTasks } from "@/drizzle";
// import { runs } from "@trigger.dev/sdk/v3";
// import { eq } from "drizzle-orm";

// type GetInitializationTaskArgs = {
// 	supabaseUserId: string;
// };
// export const getUserInitializationTask = async ({
// 	supabaseUserId,
// }: GetInitializationTaskArgs) => {
// 	const [task] = await db
// 		.select({ id: userInitialTasks.taskId })
// 		.from(supabaseUserMappings)
// 		.innerJoin(
// 			userInitialTasks,
// 			eq(userInitialTasks.userId, supabaseUserMappings.userId),
// 		)
// 		.where(eq(supabaseUserMappings.supabaseUserId, supabaseUserId));
// 	const run = await runs.retrieve(task.id);
// 	return run;
// };
