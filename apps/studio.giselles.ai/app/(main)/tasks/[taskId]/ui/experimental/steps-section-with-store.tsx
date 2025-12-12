"use client";

import type { StepsSectionData } from "./steps-section";
import { StepsSection } from "./steps-section";
import {
	StepsSectionStoreProvider,
	useStepsSectionStore,
} from "./steps-section-store-provider";

function StepsSectionFromStore() {
	const stepsSectionData = useStepsSectionStore(
		(state) => state.stepsSectionData,
	);
	return <StepsSection {...stepsSectionData} />;
}

export function StepsSectionWithStore({
	initialData,
}: {
	initialData: StepsSectionData;
}) {
	return (
		<StepsSectionStoreProvider initialData={initialData}>
			<StepsSectionFromStore />
		</StepsSectionStoreProvider>
	);
}

