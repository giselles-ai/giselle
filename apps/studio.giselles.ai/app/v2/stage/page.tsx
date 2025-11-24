import { Suspense } from "react";
import { createAndStartTask } from "./action";
import { dataLoader } from "./data-loader";
import { Page } from "./page.client";

export default function HomePage() {
	return (
		<div className="min-h-screen bg-background overflow-x-hidden">
			<Suspense fallback={<div>Loading...</div>}>
				<Page
					dataLoader={dataLoader()}
					createAndStartTaskAction={createAndStartTask}
				/>
			</Suspense>
		</div>
	);
}
