"use client";

import { ReactFlowProvider } from "@xyflow/react";
import type { ReactNode } from "react";
import { ToastProvider } from "../../../ui/toast";
import { MousePositionProvider, ToolbarContextProvider } from "../../tool";

type ProviderComponent = React.FC<{ children: ReactNode }>;

function composeProviders(...providers: ProviderComponent[]) {
	return ({ children }: { children: ReactNode }) => {
		let wrapped = children;

		for (let i = 0; i < providers.length; i++) {
			const Provider = providers[providers.length - 1 - i];
			wrapped = <Provider>{wrapped}</Provider>;
		}

		return <>{wrapped}</>;
	};
}

export const RootProvider = composeProviders(
	ToastProvider,
	ReactFlowProvider,
	ToolbarContextProvider,
	MousePositionProvider,
);
