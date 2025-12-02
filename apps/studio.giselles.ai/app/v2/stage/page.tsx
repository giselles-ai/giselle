import { LoaderCircle } from "lucide-react";
import { Suspense } from "react";
import { createAndStartTask } from "./action";
import { dataLoader } from "./data-loader";
import { Page } from "./page.client";

export default function HomePage() {
	return (
		<div className="min-h-screen bg-background overflow-x-hidden">
			<Suspense
				fallback={
					<div className="min-h-screen flex items-center justify-center">
						<div className="flex flex-col items-center gap-3">
							<p
								className="text-[20px] font-sans font-normal text-[hsl(192,73%,84%)]"
								style={{
									textShadow:
										"0 0 20px rgb(0,135,246), 0 0 40px rgb(0,135,246), 0 0 60px rgb(0,135,246)",
								}}
							>
								Loading...
							</p>
							<LoaderCircle
								className="h-5 w-5 text-[hsl(192,73%,84%)] animate-spin drop-shadow-[0_0_20px_#0087F6]"
								aria-label="Loading"
							/>
						</div>
					</div>
				}
			>
				<Page
					dataLoader={dataLoader()}
					createAndStartTaskAction={createAndStartTask}
				/>
			</Suspense>
		</div>
	);
}
