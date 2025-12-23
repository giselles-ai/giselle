import { Button } from "@giselle-internal/ui/button";
import { useToasts } from "@giselle-internal/ui/toast";
import type { App, AppEntryNode } from "@giselles-ai/protocol";
import { useGiselle } from "@giselles-ai/react";
import { LoaderIcon } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import type { KeyedMutator } from "swr";

export function AppEntryConfiguredView({
	app,
	mutateApp,
}: {
	node: AppEntryNode;
	app: App;
	mutateApp: KeyedMutator<{ app: App }>;
}) {
	const client = useGiselle();

	const [appDescription, setAppDescription] = useState(app.description);
	const [isSavingDescription, setIsSavingDescription] = useState(false);

	const { info } = useToasts();

	useEffect(() => {
		setAppDescription(app.description);
	}, [app.description]);

	const persistApp = useCallback(
		async (updatedFields: Pick<App, "description">) => {
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
		</div>
	);
}
