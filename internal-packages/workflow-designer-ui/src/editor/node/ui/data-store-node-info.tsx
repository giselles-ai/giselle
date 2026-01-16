import { isDataStoreNode, type NodeLike } from "@giselles-ai/protocol";
import { useDataStore } from "@giselles-ai/react";
import type { ReactElement } from "react";
import { RequiresSetupBadge } from "./requires-setup-badge";

function DataStoreNameBadge({ label }: { label: string }): ReactElement {
	return (
		<div className="px-[16px]">
			<div className="inline-flex items-center gap-1.5 rounded-full bg-data-store-node-1/50 px-[16px] py-1 text-[12px] font-medium text-inverse transition-colors">
				<span className="truncate max-w-[120px]">{label}</span>
			</div>
		</div>
	);
}

export function DataStoreNodeInfo({
	node,
}: {
	node: NodeLike;
}): ReactElement | null {
	const { dataStores } = useDataStore();

	if (!isDataStoreNode(node)) {
		return null;
	}

	if (node.content.state.status !== "configured") {
		return <RequiresSetupBadge />;
	}

	const store = dataStores.find((s) => s.id === node.content.state.dataStoreId);

	if (!store) {
		return <RequiresSetupBadge />;
	}

	return <DataStoreNameBadge label={store.name} />;
}
