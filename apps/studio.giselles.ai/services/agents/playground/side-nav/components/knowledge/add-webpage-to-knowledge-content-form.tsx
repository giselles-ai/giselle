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
import { GlobeIcon } from "lucide-react";
import type { FC } from "react";
import { useFormState } from "react-dom";
import {
	type KnowledgeId,
	addKnowledgeContent,
	knowledgeContentType,
	scrapeWebpage,
} from "../../../../knowledges";

type AddWebpageToKnowledgeContentFormProps = {
	knowledgeId: KnowledgeId;
	onSubmit?: () => void;
};
export const AddWebpageToKnowledgeContentForm: FC<
	AddWebpageToKnowledgeContentFormProps
> = ({ knowledgeId, onSubmit }) => {
	const [state, action, pending] = useFormState<string | null, FormData>(
		async (prevState, formData) => {
			const url = formData.get("url");
			if (url == null || typeof url !== "string" || url.length === 0) {
				return "URL is required";
			}
			const scrapeData = await scrapeWebpage(url);
			if (!scrapeData.success) {
				return scrapeData.error;
			}
			const blob = new Blob([scrapeData.markdown], {
				type: "text/markdown",
			});
			const file = new File([blob], `${scrapeData.title}.md`, {
				type: "text/markdown",
			});
			await addKnowledgeContent({
				knowledgeId,
				content: {
					name: scrapeData.title,
					type: knowledgeContentType.markdown,
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
					<GlobeIcon className="w-4 h-4" />
					<p>Add webpage</p>
				</button>
			</DialogTrigger>
			<DialogContent>
				<form onSubmit={onSubmit} action={action}>
					<DialogHeader>
						<DialogTitle>Add webpage</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="flex flex-col gap-4">
							<Label htmlFor="url">URL</Label>
							<Input id="url" name="url" />
						</div>
					</div>
					<DialogFooter>
						<Button type="submit">Add Webpage</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
