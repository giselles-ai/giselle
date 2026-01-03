import { Button } from "@giselle-internal/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
} from "@giselle-internal/ui/dialog";
import { Input } from "@giselle-internal/ui/input";
import { useToasts } from "@giselle-internal/ui/toast";
import type { App, AppEntryNode } from "@giselles-ai/protocol";
import { useFeatureFlag, useGiselle } from "@giselles-ai/react";
import { LoaderIcon } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import type { KeyedMutator } from "swr";
import ClipboardButton from "../../../ui/clipboard-button";

type ApiSecretRecordResponse = {
	record: {
		id: string;
		createdAt: number;
		lastUsedAt?: number;
		revokedAt?: number;
	} | null;
};

type ApiSecretCreateResponse = {
	token: string;
	record: {
		id: string;
		createdAt: number;
		lastUsedAt?: number;
		revokedAt?: number;
	};
};

export function AppEntryConfiguredView({
	app,
	mutateApp,
}: {
	node: AppEntryNode;
	app: App;
	mutateApp: KeyedMutator<{ app: App }>;
}) {
	const client = useGiselle();
	const { apiPublishing } = useFeatureFlag();

	const [appDescription, setAppDescription] = useState(app.description);
	const [isSavingDescription, setIsSavingDescription] = useState(false);
	const [apiSecretRecord, setApiSecretRecord] =
		useState<ApiSecretRecordResponse["record"]>(null);
	const [isFetchingApiSecretRecord, setIsFetchingApiSecretRecord] =
		useState(false);
	const [isCreatingApiKey, setIsCreatingApiKey] = useState(false);
	const [showOnceToken, setShowOnceToken] = useState<string | null>(null);
	const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);

	const { info } = useToasts();

	useEffect(() => {
		setAppDescription(app.description);
	}, [app.description]);

	const fetchApiSecretRecord = useCallback(async () => {
		setIsFetchingApiSecretRecord(true);
		try {
			const res = (await client.getCurrentApiSecretRecordForApp({
				appId: app.id,
			})) as ApiSecretRecordResponse;
			setApiSecretRecord(res.record);
		} catch {
			setApiSecretRecord(null);
		} finally {
			setIsFetchingApiSecretRecord(false);
		}
	}, [app.id, client]);

	useEffect(() => {
		if (!apiPublishing) return;
		if (!app.apiPublishing?.apiKeyId) {
			setApiSecretRecord(null);
			return;
		}
		void fetchApiSecretRecord();
	}, [apiPublishing, app.apiPublishing?.apiKeyId, fetchApiSecretRecord]);

	const persistApp = useCallback(
		async (
			updatedFields: Partial<Pick<App, "description" | "apiPublishing">>,
		) => {
			await client.saveApp({
				app: {
					...app,
					...updatedFields,
				},
			});
			await mutateApp();
			info("App updated successfully");
		},
		[app, client, mutateApp, info],
	);

	const handleDescriptionSubmit = useCallback(
		async (event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			if (appDescription === app.description) {
				return;
			}
			setIsSavingDescription(true);
			try {
				await persistApp({
					description: appDescription,
				});
			} catch (error) {
				console.error("Failed to update app description", error);
			} finally {
				setIsSavingDescription(false);
			}
		},
		[app.description, appDescription, persistApp],
	);

	const handleCreateApiKey = useCallback(async () => {
		setIsCreatingApiKey(true);
		try {
			const json = (await client.createApiSecret({
				appId: app.id,
			})) as ApiSecretCreateResponse;
			setShowOnceToken(json.token);
			setIsTokenDialogOpen(true);
			setApiSecretRecord(json.record);
			await mutateApp();
			info("API key created (shown once)");
		} catch (error) {
			console.error("Failed to create API key", error);
		} finally {
			setIsCreatingApiKey(false);
		}
	}, [app.id, client, mutateApp, info]);

	return (
		<div className="flex flex-col gap-[16px] p-0 px-1 overflow-y-auto">
			<div className="flex flex-col gap-[8px]">
				<form onSubmit={handleDescriptionSubmit} className="w-full">
					<textarea
						id="app-description"
						placeholder="Describe your app..."
						value={appDescription}
						onChange={(event) => setAppDescription(event.target.value)}
						className="w-full rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none border-none bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] text-inverse text-[14px] resize-none"
						rows={3}
						data-1p-ignore
					/>
					<div className="mt-[4px] flex justify-end">
						<Button
							type="submit"
							variant="primary"
							size="large"
							disabled={isSavingDescription}
							leftIcon={
								isSavingDescription && (
									<LoaderIcon className="size-[14px] animate-spin" />
								)
							}
						>
							Save
						</Button>
					</div>
				</form>
			</div>

			{apiPublishing && (
				<div className="flex flex-col gap-[16px] pt-[8px] border-t border-border">
					<div className="flex flex-col gap-[12px]">
						<div className="flex flex-col gap-[4px]">
							<label htmlFor="api-key" className="text-[12px] text-text-muted">
								Secret Key
							</label>
							<div className="flex items-center gap-[8px]">
								<Input
									id="api-key"
									type="text"
									value={
										app.apiPublishing?.apiKeyId
											? `Key created (${apiSecretRecord?.id ?? app.apiPublishing.apiKeyId})`
											: "No key yet"
									}
									readOnly
									className="flex-1 font-mono text-[12px]"
								/>
								<Button
									type="button"
									variant="solid"
									size="compact"
									disabled={isCreatingApiKey}
									onClick={handleCreateApiKey}
									leftIcon={
										isCreatingApiKey && (
											<LoaderIcon className="size-[14px] animate-spin" />
										)
									}
								>
									Create new key
								</Button>
							</div>
							<div className="flex items-center justify-between text-[12px] text-text-muted">
								<span>
									{isFetchingApiSecretRecord
										? "Loading key metadata..."
										: apiSecretRecord?.lastUsedAt
											? `Last used: ${new Date(apiSecretRecord.lastUsedAt).toLocaleString()}`
											: apiSecretRecord?.id
												? "Last used: -"
												: ""}
								</span>
							</div>
						</div>
					</div>
				</div>
			)}

			<Dialog
				open={isTokenDialogOpen}
				onOpenChange={(open) => {
					setIsTokenDialogOpen(open);
					if (!open) {
						setShowOnceToken(null);
					}
				}}
			>
				<DialogContent variant="glass">
					<DialogTitle>API key created</DialogTitle>
					<DialogDescription>
						This token is shown only once. Copy it now and store it safely.
					</DialogDescription>

					<div className="mt-4 flex items-center gap-2">
						<Input
							type="text"
							readOnly
							value={showOnceToken ?? ""}
							className="flex-1 font-mono text-[12px]"
						/>
						<ClipboardButton
							text={showOnceToken ?? ""}
							tooltip="Copy token"
							sizeClassName="h-[20px] w-[20px]"
						/>
					</div>

					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="solid" size="large">
								Close
							</Button>
						</DialogClose>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
