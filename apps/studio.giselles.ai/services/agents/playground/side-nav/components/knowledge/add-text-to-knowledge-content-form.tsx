import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TextIcon } from "lucide-react";
import type { FC } from "react";
import { useFormState } from "react-dom";
import {
	type KnowledgeId,
	addKnowledgeContent,
	knowledgeContentType,
} from "../../../../knowledges";

type AddTextToKnowledgeContentFormProps = {
	knowledgeId: KnowledgeId;
	onSubmit?: () => void;
};
export const AddTextToKnowledgeContentForm: FC<
	AddTextToKnowledgeContentFormProps
> = ({ knowledgeId, onSubmit }) => {
	const [state, action, pending] = useFormState<string | null, FormData>(
		async (prevState, formData) => {
			const title = formData.get("title");
			const body = formData.get("body");
			if (title == null || typeof title !== "string" || title.length === 0) {
				return "Title is required";
			}
			if (body == null || typeof body !== "string" || body.length === 0) {
				return "Body is required.";
			}

			const content = `# ${title}\n\n${body}`;
			const blob = new Blob([content], {
				type: "text/markdown",
			});
			const file = new File([blob], `${title}.md`, {
				type: "text/markdown",
			});
			await addKnowledgeContent({
				knowledgeId,
				content: {
					name: title,
					type: knowledgeContentType.text,
					file,
				},
			});
			return null;
		},
		null,
	);
	return (
		<Dialog>
			<DialogTrigger asChild>
				<button type="button" className="flex items-center gap-2">
					<TextIcon className="w-4 h-4" />
					<p>Add text conent</p>
				</button>
			</DialogTrigger>
			<DialogContent>
				<form onSubmit={onSubmit} action={action}>
					<DialogHeader>
						<DialogTitle>Add text content</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="flex flex-col gap-4">
							<Label htmlFor="title">Title</Label>
							<Input id="title" name="title" />
						</div>
						<div className="flex flex-col gap-4">
							<Label htmlFor="content">Content</Label>
							<Textarea id="content" name="body" rows={10} />
						</div>
					</div>
					<DialogFooter>
						<Button type="submit">Add Content</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
