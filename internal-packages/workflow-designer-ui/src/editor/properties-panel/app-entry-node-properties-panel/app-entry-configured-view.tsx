import type { AppEntryNode, AppId } from "@giselles-ai/protocol";
import { AppParameterId } from "@giselles-ai/protocol";
import { useGiselle } from "@giselles-ai/react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { SettingDetail, SettingLabel } from "../ui/setting-label";
import { AppIconSelect } from "./app-icon-select";

export function AppEntryConfiguredView({
	node,
	appId,
}: {
	node: AppEntryNode;
	appId: AppId;
}) {
	const giselle = useGiselle();
	const { data, isLoading } = useSWR(`getApp/${appId}`, () =>
		giselle.getApp({ appId }),
	);
	const [appDescription, setAppDescription] = useState("");
	const [selectedIconName, setSelectedIconName] = useState("");
	const appDescriptionFromServer = data?.app.description ?? "";
	const appIconNameFromServer = data?.app.iconName ?? "";
	const appIdFromServer = data?.app.id;

	useEffect(() => {
		if (appIdFromServer === undefined) {
			return;
		}

		setAppDescription(appDescriptionFromServer);
		setSelectedIconName(appIconNameFromServer);
	}, [appIdFromServer, appDescriptionFromServer, appIconNameFromServer]);

	if (isLoading) {
		return null;
	}

	if (data === undefined) {
		console.warn("App data is undefined");
		return null;
	}

	return (
		<div className="flex flex-col gap-[16px] p-0 px-1 overflow-y-auto">
			<div className="flex flex-col gap-[8px]">
				<SettingLabel className="py-[1.5px]">App Icon</SettingLabel>
				<SettingDetail size="md" className="text-text-muted">
					Choose the icon shown for this app across the workspace.
				</SettingDetail>
				<div className="w-full">
					<AppIconSelect
						value={selectedIconName || undefined}
						onValueChange={(value) => setSelectedIconName(value)}
					/>
				</div>
			</div>

			<div className="flex flex-col gap-[8px]">
				<SettingLabel className="py-[1.5px]" htmlFor="app-description">
					App Description
				</SettingLabel>
				<SettingDetail>Description</SettingDetail>
				<textarea
					id="app-description"
					placeholder="Enter app description"
					value={appDescription}
					onChange={(event) => setAppDescription(event.target.value)}
					className="w-full rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none border-none bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] text-inverse text-[14px] resize-none"
					rows={3}
					data-1p-ignore
				/>
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
									? data.app.parameters.find(
											(p) => p.id === parameterIdResult.data,
										)
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
