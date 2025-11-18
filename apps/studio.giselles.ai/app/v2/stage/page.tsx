import { Button } from "@giselle-internal/ui/button";
import { Suspense } from "react";
import { createAndStartTask } from "./action";
import { dataLoader } from "./data-loader";
import { Page } from "./page.client";

export default function HomePage() {
	return (
		<div className="min-h-screen bg-background">
			<div className="border-b border-border bg-card/30 backdrop-blur-sm">
				<div className="max-w-6xl mx-auto px-8 py-16">
					<h1 className="text-5xl font-bold text-foreground mb-4">
						Welcome to the Giselle Stage
					</h1>
					<p className="text-lg text-muted-foreground mb-6 max-w-2xl">
						Unleash your creativity and productivity with AI-powered apps.
						Choose an app below to get started.
					</p>
					<Button variant="outline" type="button">
						Learn more
					</Button>
				</div>
			</div>

			<Suspense fallback={<div>Loading...</div>}>
				<Page
					dataLoader={dataLoader()}
					createAndStartTaskAction={createAndStartTask}
				/>
			</Suspense>
		</div>
	);
}
