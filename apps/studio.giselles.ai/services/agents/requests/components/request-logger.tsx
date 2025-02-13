import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import "./markdown.css";
import {
	CheckCircleIcon,
	CircleIcon,
	FileTextIcon,
	LoaderCircleIcon,
} from "lucide-react";
import { type FC, useState } from "react";
import { match } from "ts-pattern";
import { portDirection } from "../../nodes";
import { portType } from "../../nodes/types";
import { useRequest } from "../context";
import { requestStatus, requestStepStatus } from "../types";

export const RequestLogger: FC = () => {
	const { state } = useRequest();
	const [showArtifact, setShowArtifact] = useState(false);

	if (state.request == null) {
		return;
	}
	return (
		<div>
			{showArtifact ? (
				<div className="p-4">
					<div className="flex items-center">
						<button
							type="button"
							onClick={() => {
								setShowArtifact(false);
							}}
						>
							←
						</button>
					</div>

					<div
						className="markdown"
						// biome-ignore lint/security/noDangerouslySetInnerHtml:
						dangerouslySetInnerHTML={{ __html: state.request.result ?? "" }}
					/>
				</div>
			) : (
				<>
					{state.request.status === requestStatus.completed && (
						<button
							type="button"
							className="bg-gray-100 rounded-lg p-4 flex items-center space-x-4 max-w-md cursor-pointer hover:bg-gray-200 transition-colors duration-200 my-10"
							onClick={() => setShowArtifact(true)}
						>
							<div className="bg-white rounded-lg p-2">
								<FileTextIcon className="text-gray-600" size={24} />
							</div>
							<div className="flex flex-col">
								<h2 className="text-lg font-semibold text-gray-800">Result</h2>
							</div>
						</button>
					)}
					<Accordion type="multiple">
						{state.request.stacks.flatMap((stack) =>
							stack.steps.map((step) => (
								<AccordionItem key={step.id} value={step.id}>
									<AccordionTrigger>
										<div className="flex items-center justify-between w-full">
											<p>{step.node.name}</p>
											<div className="flex items-center justify-end gap-2">
												{match(step)
													.with(
														{ status: requestStepStatus.inProgress },
														() => (
															<LoaderCircleIcon className="w-4 h-4 animate-spin" />
														),
													)
													.with({ status: requestStepStatus.completed }, () => (
														<CheckCircleIcon className="w-4 h-4" />
													))
													.otherwise(() => null)}
											</div>
										</div>
									</AccordionTrigger>
									<AccordionContent>
										{match(step)
											.with({ status: requestStepStatus.inProgress }, () => (
												<p>Running...</p>
											))
											.with({ status: requestStepStatus.completed }, () => (
												<div className="max-h-[400px] overflow-y-auto flex flex-col gap-4">
													{step.node.ports.filter(
														({ direction, type }) =>
															type === portType.data &&
															direction === portDirection.target,
													).length > 0 && (
														<div>
															<p className="mb-2">Incoming Messages</p>
															{step.node.ports
																.filter(
																	({ direction, type }) =>
																		type === portType.data &&
																		direction === portDirection.target,
																)
																.map((port) => (
																	<p key={port.id} className="text-xs">
																		{port.name}:
																		{
																			step.portMessages.find(
																				({ portId }) => portId === port.id,
																			)?.message
																		}
																	</p>
																))}
														</div>
													)}
													{step.node.ports.filter(
														({ direction, type }) =>
															type === portType.data &&
															direction === portDirection.source,
													).length > 0 && (
														<div>
															<p className="mb-2">Outgoing Messages</p>
															{step.node.ports
																.filter(
																	({ direction, type }) =>
																		type === portType.data &&
																		direction === portDirection.source,
																)
																.map((port) => (
																	<p key={port.id} className="text-xs">
																		{port.name}:
																		{
																			step.portMessages.find(
																				({ portId }) => portId === port.id,
																			)?.message
																		}
																	</p>
																))}
														</div>
													)}
												</div>
											))
											.otherwise(() => null)}
									</AccordionContent>
								</AccordionItem>
							)),
						)}
					</Accordion>
				</>
			)}
		</div>
	);
};
