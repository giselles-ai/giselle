import { useToasts } from "@giselle-internal/ui/toast";
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

	const { info } = useToasts();

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
			info("App updated successfully");
		},
		[app, client, mutateApp, info],
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

	return (
		<div className="flex flex-col gap-[16px] p-0 px-1 overflow-y-auto">
			<div className="flex flex-col gap-[8px]">
				<SettingLabel className="py-[1.5px]">App Settings</SettingLabel>

				<div className="flex items-center justify-between gap-[12px]">
					<SettingDetail size="md" className="text-text-muted shrink-0">
						Icon
					</SettingDetail>
					<div className="flex items-center justify-end gap-[8px] min-w-0">
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
					<SettingDetail size="md" className="text-text-muted">
						Description
					</SettingDetail>
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
												<span className="text-[14px]">{output.label}</span>
												{parameter?.required && (
													<span className="bg-red-900/20 text-red-900 text-[12px] font-medium px-[6px] py-[1px] rounded-full">
														required
													</span>
												)}
											</div>
											{parameter && (
												<span className="text-[12px] text-text-muted">
													{parameter.type}
												</span>
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
