import { TaskId } from "@giselles-ai/protocol";
import { notFound } from "next/navigation";

export default async function ({
	children,
	params,
}: React.PropsWithChildren<{
	params: Promise<{ taskId: string }>;
}>) {
	const { taskId: taskIdParam } = await params;

	const result = TaskId.safeParse(taskIdParam);
	if (!result.success) {
		notFound();
	}

	return (
		<div className="bg-bg text-foreground min-h-screen md:h-screen font-sans">
			<main className="m-0 md:m-[8px] rounded-none md:rounded-[12px] backdrop-blur-md border-0 md:border md:border-border shadow-black/10 shadow-inner overflow-hidden">
				{children}
			</main>
		</div>
	);
}
