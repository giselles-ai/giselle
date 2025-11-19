"use client";

import { isIconName } from "@giselle-internal/ui/utils";
import type { AppEntryNode, AppId } from "@giselles-ai/protocol";
import { useGiselle } from "@giselles-ai/react";
import { ZapIcon } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import useSWR from "swr";

export function AppEntryNodeIcon({
	node,
	...svgProps
}: { node: AppEntryNode } & React.SVGProps<SVGSVGElement>) {
	if (node.content.status === "unconfigured") {
		return <ZapIcon {...svgProps} data-content-type-icon />;
	}
	return (
		<ConfiguredAppEntryNodeIcon appId={node.content.appId} {...svgProps} />
	);
}

function ConfiguredAppEntryNodeIcon({
	appId,
	...svgProps
}: { appId: AppId } & React.SVGProps<SVGSVGElement>) {
	const giselle = useGiselle();
	const { data, isLoading } = useSWR(`getApp/${appId}`, () =>
		giselle.getApp({ appId }),
	);
	if (isLoading) {
		return null;
	}
	if (data === undefined) {
		console.warn(`App with ID ${appId} not found`);
		return null;
	}
	return (
		<DynamicIcon
			{...svgProps}
			name={isIconName(data.app.iconName) ? data.app.iconName : "cable"}
			data-content-type-icon
		/>
	);
}
