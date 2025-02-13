"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createId } from "@paralleldrive/cuid2";
import { type FC, useActionState } from "react";
import { type Knowledge, addKnowledge } from "../../../../knowledges";
import { usePlayground } from "../../../context";
import { Layout } from "../layout";
import { ContentStateProvider } from "./content-state-provider";
import { KnowledgeContentList } from "./knowledge-content-list";

type KnowledgeListProps = {
	knowledges: Knowledge[];
};
export const KnowledgeList: FC<KnowledgeListProps> = ({ knowledges }) => {
	return (
		<Layout title="Knowledge">
			<div className="flex flex-col gap-8">
				<Accordion type="multiple">
					{knowledges.map((knowledge) => (
						<AccordionItem key={knowledge.id} value={knowledge.id}>
							<AccordionTrigger> {knowledge.name}</AccordionTrigger>
							<AccordionContent>
								<ContentStateProvider>
									<KnowledgeContentList
										knowledgeId={knowledge.id}
										knowledgeContents={knowledge.contents}
									/>
								</ContentStateProvider>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>

				<AddKnowledgeForm />
			</div>
		</Layout>
	);
};

type AddKnowledgeError = string;
export const AddKnowledgeForm: FC = () => {
	const { state } = usePlayground();
	const [error, action, isPending] = useActionState(
		async (prevState: AddKnowledgeError | null, formData: FormData) => {
			const name = formData.get("name");
			if (typeof name !== "string") {
				return "invalid type";
			}
			if (name.length === 0) {
				return "name is required";
			}
			await addKnowledge({
				agentId: state.agentId,
				knowledge: {
					id: `knwl_${createId()}`,
					name,
					contents: [],
				},
			});
			return null;
		},
		null,
	);
	return (
		<Card>
			<CardHeader>
				<CardTitle>Add Knowledge</CardTitle>
				<CardDescription>
					Create a new knowledge to categorize related information.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form className="flex items-center gap-4" action={action}>
					<Input name="name" data-1p-ignore />
					<Button type="submit" disabled={isPending}>
						Add
					</Button>
				</form>
			</CardContent>
		</Card>
	);
};
