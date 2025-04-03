import { Button } from "../../ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../../ui/card";
import { Stepper } from "./stepper";
import { TitleHeader } from "./title-header";

interface RequireInstallationProps {
	onInstall?: () => void;
}

export function RequireInstallation({ onInstall }: RequireInstallationProps) {
	return (
		<div>
			<TitleHeader />
			<Stepper currentStep={2} />

			<Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
				<div className="bg-gradient-to-r from-slate-900 to-slate-900/80 backdrop-blur-sm">
					<CardHeader>
						<CardTitle className="text-xl font-semibold">
							Install Giselle GitHub App
						</CardTitle>
						<CardDescription className="text-gray-400">
							Install and configure the Giselle GitHub App for your account or
							organization
						</CardDescription>
					</CardHeader>
				</div>

				<CardContent className="p-6">
					<p className="mb-4">
						The Giselle GitHub App needs to be installed in your account or
						organization to:
					</p>
					<ul className="space-y-2 text-gray-400">
						<li className="flex items-center gap-2">
							• Receive webhook events from your repositories
						</li>
						<li className="flex items-center gap-2">
							• Access repository contents and GitHub resources such as pull
							requests, issues, and others
						</li>
					</ul>
				</CardContent>

				<CardFooter className="flex justify-end p-6 bg-slate-900/50">
					<Button
						className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0"
						onClick={onInstall}
					>
						Install GitHub App
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
