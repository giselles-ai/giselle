import {
	type Generation,
	isCompletedGeneration,
	isFailedGeneration,
} from "@giselle-sdk/data-type";
import { WilliIcon } from "../icons";
import { MemoizedMarkdown } from "./memoized-markdown";

function Spinner() {
	return (
		<div className="flex gap-[12px] text-black-400">
			<WilliIcon className="w-[20px] h-[20px] animate-pop-pop-1" />
			<WilliIcon className="w-[20px] h-[20px] animate-pop-pop-2" />
			<WilliIcon className="w-[20px] h-[20px] animate-pop-pop-3" />
		</div>
	);
}
export function QueryResultView({
	generation,
}: {
	generation: Generation;
}) {
	if (isFailedGeneration(generation)) {
		return generation.error.message;
	}

	if (generation.status !== "completed" && generation.status !== "cancelled") {
		return (
			<div className="pt-[8px]">
				<Spinner />
			</div>
		);
	}

	if (isCompletedGeneration(generation)) {
		const textOutputs = generation.outputs
			.filter((output) => output.type === "generated-text")
			.map((output) => (output.type === "generated-text" ? output.content : ""))
			.join("\n\n");
		return <MemoizedMarkdown content={textOutputs} />;
	}

	return null;
}
