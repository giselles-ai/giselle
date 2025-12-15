import { Button } from "@giselle-internal/ui/button";
import { useToasts } from "@giselle-internal/ui/toast";
import type { App, AppEntryNode } from "@giselles-ai/protocol";
import { AppParameterId } from "@giselles-ai/protocol";
import { useGiselle } from "@giselles-ai/react";
import { LoaderIcon, PlusIcon } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import type { KeyedMutator } from "swr";
import { SettingLabel } from "../ui/setting-label";

function getAppEntryInputLabel(label: string): string {
	const match = /^Input\((.+)\)$/.exec(label);
	if (!match) return label;
	return match[1] ?? label;
}

export function AppEntryConfiguredView({
	node,
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
		async (updatedFields: Partial<App>) => {
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
				<SettingLabel className="py-[1.5px]">App Description</SettingLabel>

				<div className="flex flex-col gap-[8px]">
					<form onSubmit={handleDescriptionSubmit} className="relative w-full">
						<textarea
							id="app-description"
							placeholder="Enter app description"
							value={appDescription}
							onChange={(event) => setAppDescription(event.target.value)}
							className="w-full rounded-[8px] py-[8px] px-[12px] pr-[96px] outline-none focus:outline-none border-none bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] text-inverse text-[14px] resize-none"
							rows={3}
							data-1p-ignore
						/>
						{isSavingDescription && (
							<div className="absolute right-[12px] bottom-[12px]">
								<LoaderIcon className="size-[14px] text-text-muted animate-spin" />
							</div>
						)}
					</form>
				</div>
			</div>

			{node.outputs.length > 0 && (
				<div className="space-y-0">
					<SettingLabel className="mb-0">Input Parameter</SettingLabel>
					<div className="px-[4px] py-0 w-full bg-transparent text-[14px] mt-[4px]">
						<ul className="w-full flex flex-col gap-[12px]">
							{node.outputs.map((output) => {
								const parameterIdResult = AppParameterId.schema.safeParse(
									output.accessor,
								);
								const parameter = parameterIdResult.success
									? app.parameters.find((p) => p.id === parameterIdResult.data)
									: undefined;

								return (
									<li key={output.id}>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-[8px]">
												<span className="text-[14px]">
													{getAppEntryInputLabel(output.label)}
												</span>
												{parameter && (
													<span className="text-[12px] text-text-muted">
														{parameter.type}
													</span>
												)}
												{parameter?.required && (
													<span className="bg-red-900/20 text-red-900 text-[12px] font-medium px-[6px] py-[1px] rounded-full">
														required
													</span>
												)}
											</div>
											<Button
												type="button"
												variant="subtle"
												size="default"
												leftIcon={<PlusIcon className="size-[12px]" />}
											>
												Select Source
											</Button>
										</div>
									</li>
								);
							})}
						</ul>
					</div>
				</div>
			)}
		</div>
	);
}
