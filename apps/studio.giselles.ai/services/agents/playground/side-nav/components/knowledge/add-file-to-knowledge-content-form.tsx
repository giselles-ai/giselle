import { HardDriveUploadIcon } from "lucide-react";
import type { FC } from "react";
import { useFormState } from "react-dom";
import {
	type KnowledgeId,
	addKnowledgeContent,
	knowledgeContentType,
} from "../../../../knowledges";

type AddFileToKnowledgeContentFormProps = {
	knowledgeId: KnowledgeId;
	onSubmit?: () => void;
};
export const AddFileToKnowledgeContentForm: FC<
	AddFileToKnowledgeContentFormProps
> = ({ knowledgeId, onSubmit }) => {
	const [state, action, pending] = useFormState<string | null, FormData>(
		async (prevState, formData) => {
			const file = formData.get("file");
			if (file == null || typeof file === "string") {
				return "File is required.";
			}
			await addKnowledgeContent({
				knowledgeId,
				content: {
					name: file.name,
					type: knowledgeContentType.file,
					file,
				},
			});
			return null;
		},
		null,
	);
	return (
		<form action={action} onSubmit={onSubmit}>
			<label className="flex items-center gap-2">
				<input
					type="file"
					name="file"
					className="hidden"
					onChange={(e) => {
						e.currentTarget.form?.requestSubmit();
					}}
					disabled={pending}
				/>
				<HardDriveUploadIcon className="w-4 h-4" />
				<p>Upload from device</p>
			</label>
		</form>
	);
};
