import type { GitHubTriggerEventId } from "@giselle-sdk/flow";
import clsx from "clsx/lite";
import { InfoIcon, PlusIcon, XIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Tooltip } from "../../../../../../ui/tooltip";
import { EventTypeDisplay } from "./event-type-display";
import { RepositoryDisplay } from "./repository-display";

interface LabelsInputStepProps {
	eventId: GitHubTriggerEventId;
	owner: string;
	repo: string;
	onBack: () => void;
	onSubmit: (
		e: FormEvent<HTMLFormElement>,
		rawLabels: { id: number; value: string }[],
	) => void;
	isPending: boolean;
	labelsError: string | null;
}

export function LabelsInputStep({
	eventId,
	owner,
	repo,
	onBack,
	onSubmit,
	isPending,
	labelsError,
}: LabelsInputStepProps) {
	const [labels, setLabels] = useState([{ id: 1, value: "" }]);
	const [nextId, setNextId] = useState(2);

	return (
		<form
			className="w-full flex flex-col gap-[8px] overflow-y-auto flex-1 pr-2 custom-scrollbar"
			onSubmit={(e) => onSubmit(e, labels)}
		>
			<p className="text-[14px] text-[#F7F9FD] mb-2">Event type</p>
			<EventTypeDisplay eventId={eventId} showDescription={false} />
			<p className="text-[14px] text-[#F7F9FD] mb-2 mt-4">Repository</p>
			<RepositoryDisplay owner={owner} repo={repo} className="mb-2" />

			<fieldset className="flex flex-col gap-[8px]">
				<div className="flex items-center gap-[4px] px-[4px]">
					<p className="text-[14px] text-[#F7F9FD]">Labels</p>
					<Tooltip
						text={
							<p className="w-[260px]">
								Only issues with one of these labels will trigger the workflow.
								Add multiple labels to create OR conditions.
							</p>
						}
					>
						<button type="button">
							<InfoIcon className="size-[16px]" />
						</button>
					</Tooltip>
				</div>
				<div className="flex flex-col gap-[8px] px-[4px]">
					{labels.map((label) => (
						<div key={label.id} className="flex gap-[4px] items-center">
							<input
								type="text"
								value={label.value}
								onChange={(e) =>
									setLabels((prev) =>
										prev.map((l) =>
											l.id === label.id ? { ...l, value: e.target.value } : l,
										),
									)
								}
								className={clsx(
									"flex-1 rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
									labelsError
										? "border border-red-500 focus:border-red-400"
										: "border border-white-400 focus:border-white-900",
									"text-[14px] bg-transparent",
								)}
								placeholder="bug"
							/>
							{labels.length > 1 && (
								<button
									type="button"
									onClick={() =>
										setLabels((prev) => prev.filter((l) => l.id !== label.id))
									}
									className="p-1 text-white-400 hover:text-white-900 transition-colors"
									aria-label="Remove label"
								>
									<XIcon className="size-[16px]" />
								</button>
							)}
						</div>
					))}
					{labelsError ? (
						<p className="text-[12px] text-red-400 pl-2">{labelsError}</p>
					) : (
						<p className="text-[12px] text-white-400 pl-2">
							Labels are required for issue labeled triggers. Examples: bug,
							feature, urgent
						</p>
					)}
					<button
						type="button"
						onClick={() => {
							setLabels((prev) => [...prev, { id: nextId, value: "" }]);
							setNextId((prev) => prev + 1);
						}}
						className="flex items-center gap-[4px] p-2 text-white-400 hover:text-white-900 transition-colors text-[14px]"
					>
						<PlusIcon className="size-[16px]" />
						Add label
					</button>
				</div>
			</fieldset>

			<div className="pt-[8px] flex gap-[8px] mt-[12px] px-[4px]">
				<button
					type="button"
					className="flex-1 bg-black-700 hover:bg-black-600 text-white font-medium px-4 py-2 rounded-md text-[14px] transition-colors disabled:opacity-50 relative"
					onClick={onBack}
					disabled={isPending}
				>
					<span className={isPending ? "opacity-0" : ""}>Back</span>
				</button>
				<button
					type="submit"
					className="flex-1 bg-primary-900 hover:bg-primary-800 text-white font-medium px-4 py-2 rounded-md text-[14px] transition-colors disabled:opacity-50 relative"
					disabled={isPending}
				>
					<span className={isPending ? "opacity-0" : ""}>
						{isPending ? "Setting up..." : "Set Up"}
					</span>
					{isPending && (
						<span className="absolute inset-0 flex items-center justify-center">
							<svg
								className="animate-spin h-5 w-5 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								aria-label="Loading"
							>
								<title>Loading</title>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								></circle>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
						</span>
					)}
				</button>
			</div>
		</form>
	);
}
