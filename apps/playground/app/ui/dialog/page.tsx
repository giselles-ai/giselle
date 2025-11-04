import { Button } from "@giselle-internal/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
} from "@giselle-internal/ui/dialog";
import { DemoSection } from "../components/demo-section";
import { UiPage } from "../components/ui-page";

export default function () {
	return (
		<UiPage title="Dialog">
			<DemoSection label="Demo">
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="filled">Add Data Source</Button>
					</DialogTrigger>
					<DialogContent variant="glass">
						<div className="py-[12px]">
							<DialogTitle>Add Data Source </DialogTitle>
							<DialogDescription>
								Enter a name and value for the secret.
							</DialogDescription>
						</div>
						<div>
							<p>Contents</p>
							<DialogFooter>
								<div className="flex items-center gap-[6px]">
									<Button type="button" variant="outline" size="large">
										Cancel
									</Button>
									<Button type="button" variant="solid" size="large">
										Create
									</Button>
								</div>
							</DialogFooter>
						</div>
					</DialogContent>
				</Dialog>
			</DemoSection>
		</UiPage>
	);
}
