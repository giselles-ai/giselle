"use client";

import { Button } from "@giselle-internal/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@giselle-internal/ui/dialog";
import { Input } from "@giselle-internal/ui/input";
import { PageHeading } from "@giselle-internal/ui/page-heading";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@giselle-internal/ui/table";
import clsx from "clsx/lite";
import { Check, Copy, Info, Plus, Trash } from "lucide-react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
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
		<Button type="submit" variant="primary" size="large" disabled={pending}>
			{pending ? "Creating..." : "Create secret key"}
		</Button>
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

function CreateKeyModal({
	isOpen,
	onOpenChange,
	onSubmit,
	error,
}: {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (formData: FormData) => void;
	error: string | null;
}) {
	const [label, setLabel] = useState("");

	// Reset form when modal closes
	useEffect(() => {
		if (!isOpen) {
			setLabel("");
		}
	}, [isOpen]);

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent variant="glass">
				<DialogHeader>
					<DialogTitle className="text-[20px] font-semibold text-white-900">
						Create new secret key
					</DialogTitle>
				</DialogHeader>

				<form action={onSubmit} className="mt-6 space-y-6">
					<div className="space-y-2">
						<div className="flex items-center gap-2 text-sm text-white-800">
							Name
							<span className="text-text-muted">Optional</span>
						</div>
						<Input
							name="label"
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							placeholder="My Test Key"
							className="w-full"
							aria-label="API key name"
						/>
					</div>

					{error && (
						<div className="rounded-md border border-error-500/40 bg-error-500/10 px-3 py-2 text-sm text-error-200">
							{error}
						</div>
					)}

					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="filled" size="large">
								Cancel
							</Button>
						</DialogClose>
						<CreateApiKeySubmitButton />
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function SaveKeyModal({
	isOpen,
	onOpenChange,
	secretKey,
}: {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	secretKey: string;
}) {
	const [isCopied, setIsCopied] = useState(false);
	const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (copyTimeoutRef.current !== null) {
				clearTimeout(copyTimeoutRef.current);
				copyTimeoutRef.current = null;
			}
		};
	}, []);

	const handleCopy = async () => {
		await navigator.clipboard.writeText(secretKey);

		if (copyTimeoutRef.current !== null) {
			clearTimeout(copyTimeoutRef.current);
			copyTimeoutRef.current = null;
		}

		setIsCopied(true);
		copyTimeoutRef.current = setTimeout(() => {
			setIsCopied(false);
			copyTimeoutRef.current = null;
		}, 2000);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent variant="glass">
				<DialogHeader>
					<DialogTitle className="text-[20px] font-semibold text-white-900">
						Save your key
					</DialogTitle>
				</DialogHeader>

				<div className="mt-4 space-y-4">
					<p className="text-sm text-text-muted">
						Please save your secret key in a safe place since{" "}
						<span className="text-white-900 font-medium">
							you won't be able to view it again
						</span>
						. Keep it secure, as anyone with your API key can make requests on
						your behalf. If you do lose it, you'll need to generate a new one.
					</p>

					<div className="flex items-center gap-2 p-1 rounded-lg bg-background border border-border">
						<code className="flex-1 px-3 py-2 font-mono text-sm text-white-800 break-all">
							{secretKey}
						</code>
						<button
							type="button"
							onClick={handleCopy}
							className="flex items-center gap-1.5 px-3 py-2 text-sm text-white-800 hover:bg-white-100/5 rounded-md transition-colors cursor-pointer w-[90px] justify-center"
						>
							{isCopied ? (
								<>
									<Check className="size-4 text-green-400" />
									Copied
								</>
							) : (
								<>
									<Copy className="size-4" />
									Copy
								</>
							)}
						</button>
					</div>
				</div>

				<DialogFooter>
					<DialogClose asChild>
						<Button type="button" variant="primary" size="large">
							Done
						</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function ApiKeysPageClient({ apiKeys }: ApiKeysPageClientProps) {
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isSaveKeyModalOpen, setIsSaveKeyModalOpen] = useState(false);
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
			setIsCreateModalOpen(false);
			setIsSaveKeyModalOpen(true);
		}
	}, [createState]);

	const createError = createState && !createState.ok ? createState.error : null;
	const revokeError = revokeState && !revokeState.ok ? revokeState.error : null;

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
						<GlassButton
							type="button"
							onClick={() => setIsCreateModalOpen(true)}
						>
							<Plus className="size-4" />
							Create new secret key
						</GlassButton>
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

					{revokeError && (
						<div className="rounded-md border border-error-500/40 bg-error-500/10 px-3 py-2 text-sm text-error-200">
							{revokeError}
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
								<TableHead className="text-white-100 w-20" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{normalizedKeys.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={7}
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
													className={clsx(
														"px-2 py-1 text-xs rounded-full",
														status === "Active"
															? "bg-green-500/20 text-green-400"
															: "bg-error-500/20 text-error-200",
													)}
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
													<form action={revokeAction}>
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

			<CreateKeyModal
				isOpen={isCreateModalOpen}
				onOpenChange={setIsCreateModalOpen}
				onSubmit={createAction}
				error={createError}
			/>

			{lastCreatedToken && (
				<SaveKeyModal
					isOpen={isSaveKeyModalOpen}
					onOpenChange={(open) => {
						setIsSaveKeyModalOpen(open);
						if (!open) {
							setLastCreatedToken(null);
						}
					}}
					secretKey={lastCreatedToken}
				/>
			)}
		</div>
	);
}
