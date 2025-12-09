import { Button } from "@giselle-internal/ui/button";
import type { App, AppEntryNode } from "@giselles-ai/protocol";
import { AppParameterId } from "@giselles-ai/protocol";
import { useGiselle } from "@giselles-ai/react";
import { LoaderIcon } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import type { KeyedMutator } from "swr";
import { SettingDetail, SettingLabel } from "../ui/setting-label";
import { AppIconSelect } from "./app-icon-select";

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
	const [selectedIconName, setSelectedIconName] = useState(app.iconName);
	const [isSavingIcon, setIsSavingIcon] = useState(false);
	const [isSavingDescription, setIsSavingDescription] = useState(false);

	useEffect(() => {
		setAppDescription(app.description);
	}, [app.description]);

	useEffect(() => {
		setSelectedIconName(app.iconName);
	}, [app.iconName]);

	const persistApp = useCallback(
		async (updatedFields: Partial<App>) => {
			await client.saveApp({
				app: {
					...app,
					...updatedFields,
				},
			});
			await mutateApp();
		},
		[app, client, mutateApp],
	);

	const handleIconChange = useCallback(
		(value: string) => {
			setSelectedIconName(value);
			setIsSavingIcon(true);
			void (async () => {
				try {
					await persistApp({ iconName: value });
				} catch (error) {
					console.error("Failed to update app icon", error);
					setSelectedIconName(app.iconName);
				} finally {
					setIsSavingIcon(false);
				}
			})();
		},
		[app.iconName, persistApp],
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
					iconName: selectedIconName,
				});
			} catch (error) {
				console.error("Failed to update app description", error);
			} finally {
				setIsSavingDescription(false);
			}
		},
		[app.description, appDescription, persistApp, selectedIconName],
	);

	const isDescriptionDirty = appDescription !== app.description;

	return (
		<div className="flex flex-col gap-[16px] p-0 px-1 overflow-y-auto">
			<div className="flex flex-col gap-[8px]">
				<SettingLabel className="py-[1.5px]">App Icon</SettingLabel>
				<SettingDetail size="md" className="text-text-muted">
					Choose the icon shown for this app across the workspace.
				</SettingDetail>
				<div className="w-full flex items-center gap-[8px]">
					<AppIconSelect
						value={selectedIconName}
						onValueChange={handleIconChange}
					/>
					{isSavingIcon && (
						<LoaderIcon className="size-[16px] text-text-muted animate-spin" />
					)}
				</div>
			</div>

			<div className="flex flex-col gap-[8px]">
				<SettingLabel className="py-[1.5px]" htmlFor="app-description">
					App Description
				</SettingLabel>
				<SettingDetail>Description</SettingDetail>
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
					<Button
						type="submit"
						variant="glass"
						size="compact"
						className="absolute bottom-[8px] right-[8px] inline-flex items-center gap-[6px]"
						disabled={!isDescriptionDirty || isSavingDescription}
					>
						{isSavingDescription && (
							<LoaderIcon className="size-[14px] animate-spin" />
						)}
						Submit
					</Button>
				</form>
			</div>

			{node.outputs.length > 0 && (
				<div className="space-y-[4px]">
					<SettingLabel className="py-[1.5px]">Output Parameters</SettingLabel>
					<div className="px-[4px] py-0 w-full bg-transparent text-[14px] mt-[8px]">
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
										<div className="flex flex-col gap-[4px]">
											<div className="flex items-center gap-[8px]">
												<span className="text-[14px] font-medium">
													{output.label}
												</span>
												{parameter?.required && (
													<span className="text-[12px] text-muted-foreground">
														(Required)
													</span>
												)}
											</div>
											{parameter && (
												<div className="flex items-center gap-[8px] pl-[4px]">
													<span className="text-[12px] text-muted-foreground">
														Type: {parameter.type}
													</span>
												</div>
											)}
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
