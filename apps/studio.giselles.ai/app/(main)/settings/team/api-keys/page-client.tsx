"use client";

import { PageHeading } from "@giselle-internal/ui/page-heading";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@giselle-internal/ui/table";
import { Info, Pencil, Plus, Trash } from "lucide-react";
import Link from "next/link";
import { GlassButton } from "@/components/ui/glass-button";

type ApiKey = {
	id: string;
	name: string;
	status: "Active" | "Revoked";
	secretKey: string; // masked format: "sk-...Mm8A"
	createdAt: Date;
	lastUsedAt: Date | null;
	createdBy: string;
};

// Dummy data matching the image
const dummyApiKeys: ApiKey[] = [
	{
		id: "1",
		name: "local-dev-2",
		status: "Active",
		secretKey: "sk-...Mm8A",
		createdAt: new Date("2024-09-18"),
		lastUsedAt: new Date("2024-09-18"),
		createdBy: "satoshi",
	},
	{
		id: "2",
		name: "local-developing",
		status: "Active",
		secretKey: "sk-...eHgA",
		createdAt: new Date("2024-08-23"),
		lastUsedAt: new Date("2024-10-16"),
		createdBy: "satoshi",
	},
	{
		id: "3",
		name: "Developing",
		status: "Active",
		secretKey: "sk-...gZnP",
		createdAt: new Date("2024-07-24"),
		lastUsedAt: new Date("2024-08-22"),
		createdBy: "satoshi",
	},
];

function formatDate(date: Date): string {
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export function ApiKeysPageClient() {
	return (
		<div className="h-full bg-bg">
			<div className="px-[40px] py-[24px] flex-1 max-w-[1200px] mx-auto w-full">
				<div className="flex justify-between items-center mb-8">
					<PageHeading glow>API keys</PageHeading>
					<GlassButton>
						<span className="grid place-items-center rounded-full size-4 bg-primary-200 opacity-50">
							<Plus className="size-3 text-background group-hover:text-background transition-colors" />
						</span>
						Create new secret key
					</GlassButton>
				</div>

				<div className="flex flex-col gap-y-[16px]">
					<div className="flex flex-col gap-y-2 text-text-muted text-[14px] leading-[20px] font-geist">
						<p>
							You have permission to view and manage all API keys in this
							project.
						</p>
						<p>
							Do not share your API key with others or expose it in the browser
							or other client-side code. To protect your account's security,
							OpenAI may automatically disable any API key that has leaked
							publicly.
						</p>
						<p>
							View usage per API key on the{" "}
							<Link
								href="/settings/team/usage"
								className="text-link-muted hover:underline"
							>
								Usage page
							</Link>
							.
						</p>
					</div>

					<div className="overflow-x-auto">
						<Table className="w-full">
							<TableHeader>
								<TableRow>
									<TableHead className="text-white-100">NAME</TableHead>
									<TableHead className="text-white-100">STATUS</TableHead>
									<TableHead className="text-white-100">SECRET KEY</TableHead>
									<TableHead className="text-white-100">CREATED</TableHead>
									<TableHead className="text-white-100">
										<div className="flex items-center gap-1">
											LAST USED
											<Info className="size-3 text-text-muted" />
										</div>
									</TableHead>
									<TableHead className="text-white-100">CREATED BY</TableHead>
									<TableHead className="text-white-100 w-20"></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{dummyApiKeys.map((apiKey) => (
									<TableRow key={apiKey.id}>
										<TableCell className="text-white-800">
											{apiKey.name}
										</TableCell>
										<TableCell className="text-white-800">
											<span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
												{apiKey.status}
											</span>
										</TableCell>
										<TableCell className="text-white-800 font-mono text-sm">
											{apiKey.secretKey}
										</TableCell>
										<TableCell className="text-white-800">
											{formatDate(apiKey.createdAt)}
										</TableCell>
										<TableCell className="text-white-800">
											{apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : "-"}
										</TableCell>
										<TableCell className="text-white-800">
											{apiKey.createdBy}
										</TableCell>
										<TableCell className="text-white-800">
											<div className="flex items-center gap-2">
												<button
													type="button"
													className="p-1.5 rounded-md text-text-muted hover:text-text transition-colors"
													onClick={() => {
														console.log("Edit API key:", apiKey.id);
													}}
													aria-label="Edit API key"
												>
													<Pencil className="size-4" />
												</button>
												<button
													type="button"
													className="p-1.5 rounded-md text-text-muted hover:text-error-500 transition-colors"
													onClick={() => {
														console.log("Delete API key:", apiKey.id);
													}}
													aria-label="Delete API key"
												>
													<Trash className="size-4" />
												</button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</div>
			</div>
		</div>
	);
}
