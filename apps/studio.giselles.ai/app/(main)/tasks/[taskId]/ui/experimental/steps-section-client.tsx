"use client";

import { StepsSection } from "./steps-section";
import { StepsSectionProvider, useStepsSection } from "./steps-section-context";
import type { StepsSectionData } from "./steps-section-data";

export function StepsSectionClient({
	initial,
	refreshAction,
}: {
	initial: StepsSectionData;
	refreshAction: () => Promise<StepsSectionData>;
}) {
	return (
		<StepsSectionProvider initial={initial} refreshAction={refreshAction}>
			<StepsSectionContainer />
		</StepsSectionProvider>
	);
}

function StepsSectionContainer() {
	const { data } = useStepsSection();
	return <StepsSection {...data} />;
}
