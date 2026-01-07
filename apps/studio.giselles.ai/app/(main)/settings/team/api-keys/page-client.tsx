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
import { Info, Plus, Trash } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { GlassButton } from "@/components/ui/glass-button";
import type { ApiKeyListItem } from "@/lib/api-keys";
import {
	type CreateApiKeyActionState,
	createApiKeyAction,
	type RevokeApiKeyActionState,
	revokeApiKeyAction,
} from "./actions";

type ApiKeysPageClientProps = {
	apiKeys: ApiKeyListItem[];
};

type NormalizedApiKey = ApiKeyListItem & {
	createdAt: Date;
	lastUsedAt: Date | null;
	revokedAt: Date | null;
};

function formatDate(date: Date | null): string {
	if (!date) return "-";
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function formatSecretPreview(args: { redactedValue: string }): string {
	return args.redactedValue;
}

function CreateApiKeySubmitButton() {
	const { pending } = useFormStatus();
	return (
		<GlassButton type="submit" disabled={pending}>
			<span className="grid place-items-center rounded-full size-4 bg-primary-200 opacity-50">
				<Plus className="size-3 text-background group-hover:text-background transition-colors" />
			</span>
			{pending ? "Creating..." : "Create secret key"}
		</GlassButton>
	);
}

function RevokeApiKeyButton({ isDisabled }: { isDisabled: boolean }) {
	const { pending } = useFormStatus();
	const disabled = isDisabled || pending;
	return (
		<button
			type="submit"
			className="p-1.5 rounded-md text-text-muted hover:text-error-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={disabled}
			aria-label="Revoke API key"
		>
			<Trash className="size-4" />
		</button>
	);
}

export function ApiKeysPageClient({ apiKeys }: ApiKeysPageClientProps) {
	const [label, setLabel] = useState("");
	const [lastCreatedToken, setLastCreatedToken] = useState<string | null>(null);
	const [createState, createAction] = useActionState<
		CreateApiKeyActionState | undefined,
		FormData
	>(createApiKeyAction, undefined);
	const [revokeState, revokeAction] = useActionState<
		RevokeApiKeyActionState | undefined,
		FormData
	>(revokeApiKeyAction, undefined);

	useEffect(() => {
		if (createState?.ok) {
			setLastCreatedToken(createState.token);
			setLabel("");
		}
	}, [createState]);

	const error =
		(createState && !createState.ok ? createState.error : null) ??
		(revokeState && !revokeState.ok ? revokeState.error : null);

	const normalizedKeys: NormalizedApiKey[] = useMemo(
		() =>
			apiKeys.map((key) => ({
				...key,
				createdAt: new Date(key.createdAt),
				lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt) : null,
				revokedAt: key.revokedAt ? new Date(key.revokedAt) : null,
			})),
		[apiKeys],
	);

	return (
		<div className="h-full bg-bg">
			<div className="px-[40px] py-[24px] flex-1 max-w-[1200px] mx-auto w-full">
				<div className="flex flex-col gap-4 mb-6">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<PageHeading glow>API keys</PageHeading>
						<form
							action={createAction}
							className="flex flex-col sm:flex-row gap-2 sm:items-center"
							onSubmit={() => {
								setLastCreatedToken(null);
							}}
						>
							<label className="flex flex-col gap-1 text-xs text-text-muted">
								Name (optional)
								<input
									name="label"
									value={label}
									onChange={(event) => setLabel(event.target.value)}
									placeholder="local-dev key"
									className="rounded-md bg-background px-3 py-2 text-sm border border-white-20 min-w-[220px]"
								/>
							</label>
							<CreateApiKeySubmitButton />
						</form>
					</div>

					<div className="flex flex-col gap-y-2 text-text-muted text-[14px] leading-[20px] font-geist">
						<p>You can view and manage all API keys for this team.</p>
						<p>
							Multiple active keys are allowed; create and revoke as needed.
						</p>
						<p>
							API secrets are shown only once at creation time. Store them
							securely and rotate if they are exposed.
						</p>
					</div>

					{lastCreatedToken && (
						<div className="rounded-lg border border-primary-200/40 bg-primary-200/10 px-4 py-3 text-sm text-white-900">
							<p className="font-semibold mb-2">New secret key</p>
							<p className="mb-2">
								This secret is shown only once. Copy and store it securely.
							</p>
							<div className="flex items-center gap-2">
								<code className="px-3 py-2 rounded-md bg-background font-mono text-sm break-all">
									{lastCreatedToken}
								</code>
								<button
									type="button"
									className="text-sm text-link-muted hover:underline"
									onClick={() => {
										void navigator.clipboard.writeText(lastCreatedToken);
									}}
								>
									Copy
								</button>
							</div>
						</div>
					)}

					{error && (
						<div className="rounded-md border border-error-500/40 bg-error-500/10 px-3 py-2 text-sm text-error-200">
							{error}
						</div>
					)}
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
							{normalizedKeys.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={8}
										className="text-center text-text-muted py-6"
									>
										No API keys yet. Create one to get started.
									</TableCell>
								</TableRow>
							) : (
								normalizedKeys.map((apiKey) => {
									const status = apiKey.revokedAt ? "Revoked" : "Active";
									return (
										<TableRow key={apiKey.id}>
											<TableCell className="text-white-800">
												{apiKey.label ?? "—"}
											</TableCell>
											<TableCell className="text-white-800">
												<span
													className={`px-2 py-1 text-xs rounded-full ${
														status === "Active"
															? "bg-green-500/20 text-green-400"
															: "bg-error-500/20 text-error-200"
													}`}
												>
													{status}
												</span>
											</TableCell>
											<TableCell className="text-white-800 font-mono text-sm">
												{formatSecretPreview({
													redactedValue: apiKey.redactedValue,
												})}
											</TableCell>
											<TableCell className="text-white-800">
												{formatDate(apiKey.createdAt)}
											</TableCell>
											<TableCell className="text-white-800">
												{formatDate(apiKey.lastUsedAt)}
											</TableCell>
											<TableCell className="text-white-800">
												{apiKey.createdByName ?? "—"}
											</TableCell>
											<TableCell className="text-white-800">
												<div className="flex items-center gap-2">
													<form
														action={revokeAction}
														onSubmit={() => {
															setLastCreatedToken(null);
														}}
													>
														<input
															type="hidden"
															name="apiKeyId"
															value={apiKey.id}
														/>
														<RevokeApiKeyButton
															isDisabled={apiKey.revokedAt !== null}
														/>
													</form>
												</div>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}
