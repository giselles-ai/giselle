import { AlertCircle, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "../../components/button";

function VectorStoreHeader({ title }: { title: string }) {
	return (
		<div className="flex justify-between items-center">
			<h2
				className="text-[30px] font-sans font-medium text-[hsl(192,73%,84%)]"
				style={{
					textShadow: "0 0 20px #0087f6, 0 0 40px #0087f6, 0 0 60px #0087f6",
				}}
			>
				{title}
			</h2>
			<a
				href="https://docs.giselles.ai/guides/settings/team/vector-store"
				target="_blank"
				rel="noopener noreferrer"
				className="text-black-300 text-[14px] font-medium rounded-[4px] px-1.5 py-0.5 hover:bg-black-300/10 flex items-center gap-1.5 font-sans"
			>
				About Vector Stores
				<ExternalLink size={14} />
			</a>
		</div>
	);
}

export function GitHubAuthRequiredCard() {
	return (
		<div className="flex flex-col gap-[24px]">
			<VectorStoreHeader title="Vector Store" />
			<Card className="rounded-[8px] bg-transparent p-6 border-0">
				<div className="flex flex-col items-center justify-center py-8">
					<h4 className="text-white-400 font-medium text-[18px] leading-[21.6px] font-sans mb-2">
						You need to authenticate your GitHub account.
					</h4>
					<p className="text-black-400 text-[14px] leading-[20.4px] font-geist text-center mb-4">
						To use Vector Store, you need to authenticate your GitHub account.
						Please authenticate in the account settings.
					</p>
					<Button asChild variant="primary">
						<a href="/settings/account/authentication">
							Open Authentication Settings
						</a>
					</Button>
				</div>
			</Card>
		</div>
	);
}

export function GitHubAuthErrorCard({
	errorMessage,
}: {
	errorMessage: string;
}) {
	return (
		<div className="flex flex-col gap-[24px]">
			<VectorStoreHeader title="Vector Store" />
			<Card className="rounded-[8px] bg-transparent p-6 border-0">
				<div className="flex flex-col items-center justify-center py-8">
					<div className="flex items-center gap-2 mb-4">
						<AlertCircle className="text-error-900" size={24} />
						<h4 className="text-error-900 font-medium text-[18px] leading-[21.6px] font-sans">
							GitHub authentication error occurred.
						</h4>
					</div>
					<p className="text-error-900/70 text-[14px] leading-[20.4px] font-geist text-center mb-4">
						{errorMessage}
					</p>
				</div>
			</Card>
		</div>
	);
}

export function GitHubAppInstallRequiredCard() {
	return (
		<div className="flex flex-col gap-[24px]">
			<VectorStoreHeader title="Vector Store" />
			<Card className="rounded-[8px] bg-transparent p-6 border-0">
				<div className="flex flex-col items-center justify-center py-8">
					<h4 className="text-white-400 font-medium text-[18px] leading-[21.6px] font-sans mb-2">
						You need to install Giselle's GitHub App.
					</h4>
					<p className="text-black-400 text-[14px] leading-[20.4px] font-geist text-center mb-4">
						To use Vector Store, you need to install Giselle's GitHub App.
						Please install in the integrations settings.
					</p>
					<Button asChild variant="primary">
						<a href="/settings/team/integrations">Open Integrations Settings</a>
					</Button>
				</div>
			</Card>
		</div>
	);
}
