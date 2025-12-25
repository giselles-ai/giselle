import { LoaderCircle } from "lucide-react";
import { createSearchParamsCache, parseAsString } from "nuqs/server";
import { Suspense } from "react";
import { StageAppSelectionProvider } from "@/app/(main)/stores/stage-app-selection-store";
import { createAndStartTask } from "../lib/create-and-start-task";
import { dataLoader } from "./data-loader";
import { Page } from "./page.client";

const searchParamsCache = createSearchParamsCache({
	initialAppId: parseAsString,
});

type PlaygroundPageProps = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: PlaygroundPageProps) {
	const { initialAppId } = await searchParamsCache.parse(searchParams);

	return (
		<div className="bg-background overflow-x-hidden">
			<Suspense
				fallback={
					<div className="min-h-screen flex flex-col items-center justify-center">
						<p
							className="text-[16px] font-sans font-medium text-[hsl(192,73%,84%)] mb-4"
							style={{
								textShadow:
									"0 0 20px #0087f6, 0 0 40px #0087f6, 0 0 60px #0087f6",
							}}
						>
							Loading...
						</p>
						<LoaderCircle className="w-6 h-6 text-text animate-spin" />
					</div>
				}
			>
				<StageAppSelectionProvider
					initialSelectedAppId={initialAppId ?? undefined}
				>
					<Page
						dataLoader={dataLoader()}
						createAndStartTaskAction={createAndStartTask}
					/>
				</StageAppSelectionProvider>
			</Suspense>
		</div>
	);
}
