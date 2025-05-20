import type {
	FlowTrigger,
	Generation,
	GenerationInput,
	TriggerNode,
} from "@giselle-sdk/data-type";
import { type TriggerProvider, githubTriggers } from "@giselle-sdk/flow";
import { useGenerationRunnerSystem } from "@giselle-sdk/giselle-engine/react";
import { buildWorkflowFromNode } from "@giselle-sdk/workflow-utils";
import { clsx } from "clsx/lite";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { PlayIcon, XIcon } from "lucide-react";
import { Dialog } from "radix-ui";
import {
	type ButtonHTMLAttributes,
	type FormEventHandler,
	type ReactNode,
	useCallback,
	useMemo,
} from "react";
import { useTrigger } from "../../hooks/use-trigger";

export function Button({
	leftIcon: LeftIcon,
	rightIcon: RightIcon,
	children,
	...props
}: {
	leftIcon?: ReactNode;
	rightIcon?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<button
			type="button"
			className="bg-white-900 px-[8px] rounded-[4px] py-[4px] text-[14px] flex items-center gap-[4px] cursor-pointer outline-none text-black-900"
			{...props}
		>
			{LeftIcon}
			<div>{children}</div>
			{RightIcon}
		</button>
	);
}

export function buttonLabel(node: TriggerNode) {
	switch (node.content.provider) {
		case "manual":
			return "Start Manual Flow";
		case "github":
			return "Test with dummy data";
		default: {
			const _exhaustiveCheck: never = node.content.provider;
			throw new Error(`Unhandled trigger provider type: ${_exhaustiveCheck}`);
		}
	}
}

interface Input {
	name: string;
	label: string;
	type: "text" | "multiline-text" | "number";
	required: boolean;
}

export function TriggerInputDialog({
	node,
}: {
	node: TriggerNode;
}) {
	const { data: trigger, isLoading } = useTrigger(node);

	const { createGeneration, startGeneration } = useGenerationRunnerSystem();
	const { data } = useWorkflowDesigner();
	const inputs = useMemo<Input[]>(() => {
		if (trigger === undefined) {
			return [];
		}
		switch (trigger.configuration.provider) {
			case "github": {
				const githubTrigger = githubTriggers[trigger.configuration.event.id];
				switch (githubTrigger.event.id) {
					case "github.issue.created":
						return [
							{
								name: "title",
								label: "Title",
								type: "text",
								required: true,
							},
							{
								name: "body",
								label: "Body",
								type: "multiline-text",
								required: false,
							},
						];
					case "github.issue_comment.created":
						return [
							{
								name: "issueId",
								label: "Issue ID",
								type: "number",
								required: true,
							},
							{
								name: "issueTitle",
								label: "Issue Title",
								type: "text",
								required: true,
							},
							{
								name: "issueBody",
								label: "Issue Body",
								type: "multiline-text",
								required: true,
							},
							{
								name: "issueCommentBody",
								label: "Issue Comment",
								type: "multiline-text",
								required: true,
							},
						];
					default: {
						const _exhaustiveCheck: never = githubTrigger.event;
						throw new Error(`Unhandled event id: ${_exhaustiveCheck}`);
					}
				}
			}
			case "manual": {
				return trigger.configuration.event.parameters.map((parameter) => ({
					name: parameter.id,
					label: parameter.name,
					type: parameter.type,
					required: parameter.required,
				}));
			}
			default: {
				const _exhaustiveCheck: never = trigger.configuration;
				throw new Error(`Unhandled provider: ${_exhaustiveCheck}`);
			}
		}
	}, [trigger]);

	const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
		async (e) => {
			e.preventDefault();

			const flow = buildWorkflowFromNode(node.id, data.nodes, data.connections);
			if (flow === null) {
				return;
			}
			const generations: Generation[] = [];
			flow.jobs.map((job) =>
				job.operations.map((operation) => {
					const generationInputs: GenerationInput[] = [];
					if (operation.node.content.type === "trigger") {
						const formData = new FormData(e.currentTarget);
						for (const [key, value] of formData.entries()) {
							generationInputs.push({
								name: key,
								value: value.toString(),
							});
						}
					}
					generations.push(
						createGeneration({
							origin: {
								type: "workspace",
								id: data.id,
							},
							inputs: generationInputs,
							...operation.generationTemplate,
						}),
					);
				}),
			);
			for (const job of flow.jobs) {
				await Promise.all(
					job.operations.map(async (operation) => {
						const generation = generations.find(
							(generation) =>
								generation.context.operationNode.id ===
								operation.generationTemplate.operationNode.id,
						);
						if (generation === undefined) {
							return;
						}
						await startGeneration(generation.id);
					}),
				);
			}
		},
		[node.id, data, createGeneration, startGeneration],
	);

	if (isLoading || trigger === undefined) {
		return null;
	}
	return (
		<>
			<div className="flex justify-between items-center mb-[24px]">
				<h2 className="font-accent text-[18px] font-bold text-primary-100 drop-shadow-[0_0_10px_#0087F6]">
					{buttonLabel(node)}
				</h2>
				<div className="flex gap-[12px]">
					<Dialog.Close asChild>
						<button
							type="button"
							className="text-white-400 hover:text-white-900 outline-none"
						>
							<XIcon className="size-[20px]" />
						</button>
					</Dialog.Close>
				</div>
			</div>
			<div className="flex flex-col h-full">
				<form
					className="flex-1 flex flex-col gap-[24px] relative text-white-800 overflow-y-hidden"
					onSubmit={handleSubmit}
				>
					<p className="text-[12px] mb-[8px] text-black-400 font-hubot font-semibold">
						Execute this flow with custom input values
					</p>
					<div className="flex flex-col gap-[8px]">
						{inputs.map((input) => {
							return (
								<fieldset key={input.name} className={clsx("grid gap-2")}>
									<label
										className="text-[14px] font-medium text-white-900"
										htmlFor={input.name}
									>
										{input.label}
									</label>
									{input.type === "text" && (
										<input
											type="text"
											name={input.name}
											id={input.name}
											className={clsx(
												"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
												"border-[1px] border-white-900",
												"text-[14px]",
											)}
										/>
									)}
									{input.type === "multiline-text" && (
										<textarea
											name={input.name}
											id={input.name}
											className={clsx(
												"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
												"border-[1px] border-white-900",
												"text-[14px]",
											)}
											rows={4}
										/>
									)}
									{input.type === "number" && (
										<input
											type="number"
											name={input.name}
											id={input.name}
											className={clsx(
												"w-full flex justify-between items-center rounded-[8px] py-[8px] px-[12px] outline-none focus:outline-none",
												"border-[1px] border-white-900",
												"text-[14px]",
											)}
										/>
									)}
								</fieldset>
							);
						})}
					</div>
					<div className="flex justify-end">
						<Button
							type="submit"
							leftIcon={<PlayIcon className="size-[14px] fill-black-900" />}
						>
							Run with params
						</Button>
					</div>
				</form>
			</div>
		</>
	);
}
