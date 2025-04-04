import { useIntegration } from "@giselle-sdk/integration/react";
import { AlertCircle } from "lucide-react";
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
interface RequireAuthorizationProps {
	error?: string;
}

export function RequireAuthorization({ error }: RequireAuthorizationProps) {
	const {
		github: { components },
	} = useIntegration();

	return (
		<div>
			<TitleHeader />
			<Stepper currentStep={1} />

			{error && (
				<div className="mb-6 bg-red-950/30 border border-red-500/30 rounded-md p-4 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="bg-red-500/20 p-2 rounded-full">
							<AlertCircle className="h-5 w-5 text-red-400" />
						</div>
						<div>
							<h3 className="font-medium text-red-400">Authentication Error</h3>
							<p className="text-sm text-red-500/70">{error}</p>
						</div>
					</div>
				</div>
			)}

			<Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
				<div className="bg-gradient-to-r from-slate-900 to-slate-900/80 backdrop-blur-sm">
					<CardHeader>
						<CardTitle className="text-xl font-semibold">
							Authorize with GitHub
						</CardTitle>
						<CardDescription className="text-gray-400">
							Connect your GitHub account to get started with the integration
						</CardDescription>
					</CardHeader>
				</div>

				<CardContent className="p-6">
					<p className="py-4">
						To begin setting up the GitHub integration, you'll need to authorize
						access to your GitHub account.
					</p>
				</CardContent>

				<CardFooter className="flex justify-end p-6 border-slate-800 bg-slate-900/50">
					{components?.authentication}
					{/* <Button
						className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0"
						onClick={onAuthorize}
					>
						Authorize with GitHub
					</Button> */}
				</CardFooter>
			</Card>
		</div>
	);
}
