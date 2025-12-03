import { GlassCard } from "@giselle-internal/ui/glass-card";
import type { DocumentVectorStoreWithProfiles } from "../data";

type DocumentVectorStoreItemReadonlyProps = {
	store: DocumentVectorStoreWithProfiles;
};

export function DocumentVectorStoreItemReadonly({
	store,
}: DocumentVectorStoreItemReadonlyProps) {
	return (
		<GlassCard className="group" paddingClassName="px-[24px] py-[16px]">
			<h5 className="text-inverse font-medium text-[16px] leading-[22.4px] font-sans">
				{store.name}
			</h5>
			<div className="text-text/60 text-[13px] leading-[18px] font-geist mt-1">
				ID: {store.id}
			</div>
		</GlassCard>
	);
}
