import { Button } from "@giselle-internal/ui/button";
import {
	Dialog,
	DialogBody,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
} from "@giselle-internal/ui/dialog";
import { Input } from "@giselle-internal/ui/input";
import type { Schema } from "@giselles-ai/protocol";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { convertFormFieldsToSchema } from "./convert-form-fields-to-schema";
import { convertSchemaToFormFields } from "./convert-schema-to-form-fields";
import { FormFieldRow } from "./form-field-row";
import { createEmptyFormField, type FormField } from "./types";
import {
	hasDuplicateNames,
	hasEmptyEnumValues,
	hasEmptyNames,
} from "./validation";

interface StructuredOutputDialogProps {
	schema: Schema;
	onUpdate: (schema: Schema) => void;
	trigger: React.ReactNode;
}

export function StructuredOutputDialog({
	schema,
	onUpdate,
	trigger,
}: StructuredOutputDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [title, setTitle] = useState("");
	const [fields, setFields] = useState<FormField[]>([]);
	const [errorMessage, setErrorMessage] = useState("");

	const handleOpen = useCallback(
		(open: boolean) => {
			if (open) {
				const parsed = convertSchemaToFormFields(schema);
				setTitle(parsed.title);
				setFields(parsed.fields);
				setErrorMessage("");
			}
			setIsOpen(open);
		},
		[schema],
	);

	const handleSubmit = useCallback(
		(e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			const trimmedTitle = title.trim();
			if (!trimmedTitle) {
				setErrorMessage("Title is required.");
				return;
			}
			if (hasEmptyNames(fields)) {
				setErrorMessage("All properties must have a name.");
				return;
			}
			if (hasDuplicateNames(fields)) {
				setErrorMessage("Duplicate property names are not allowed.");
				return;
			}
			if (hasEmptyEnumValues(fields)) {
				setErrorMessage("Enum fields must have at least one value.");
				return;
			}
			const schema = convertFormFieldsToSchema(trimmedTitle, fields);
			onUpdate(schema);
			setIsOpen(false);
		},
		[title, fields, onUpdate],
	);

	const handleFieldChange = useCallback((index: number, updated: FormField) => {
		setFields((prev) => {
			const next = [...prev];
			next[index] = updated;
			return next;
		});
		setErrorMessage("");
	}, []);

	const handleFieldDelete = useCallback((index: number) => {
		setFields((prev) => prev.filter((_, i) => i !== index));
		setErrorMessage("");
	}, []);

	const handleAddField = useCallback(() => {
		setFields((prev) => [...prev, createEmptyFormField()]);
	}, []);

	return (
		<Dialog open={isOpen} onOpenChange={handleOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent size="extra-wide" variant="glass">
				<div className="mb-4 shrink-0">
					<DialogTitle className="text-[20px] font-medium text-text tracking-tight font-sans">
						Structured Output
					</DialogTitle>
					<DialogDescription className="text-[14px] text-text-muted font-geist mt-2">
						Define the JSON schema for the model's structured output.
					</DialogDescription>
				</div>

				<DialogBody className="max-h-[60vh]">
					<form
						id="structured-output-form"
						onSubmit={handleSubmit}
						className="space-y-[16px]"
					>
						<div>
							<label
								htmlFor="structured-output-title"
								className="block text-[14px] text-white/60 mb-[6px]"
							>
								Title
							</label>
							<Input
								id="structured-output-title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="Schema title"
								className="w-full"
								required
							/>
						</div>

						<div>
							<div className="text-[14px] text-white/60 mb-[6px]">
								Properties
							</div>
							{fields.length > 0 && (
								<div className="flex gap-[8px] text-[13px] text-white/30 mb-[4px] pl-[22px]">
									<div className="flex-1">Name</div>
									<div className="w-[80px]">Type</div>
									<div className="flex-1">Description</div>
									<div className="w-[22px]" />
								</div>
							)}
							<div className="space-y-[2px]">
								{fields.map((field, index) => (
									<FormFieldRow
										key={field.id}
										field={field}
										onChange={(updated) => handleFieldChange(index, updated)}
										onDelete={() => handleFieldDelete(index)}
										excludeTypes={[]}
									/>
								))}
							</div>
							<button
								type="button"
								onClick={handleAddField}
								className="flex items-center gap-[4px] mt-[8px] text-[14px] text-white/40 hover:text-white/60 transition-colors cursor-pointer"
							>
								<Plus className="size-[14px]" />
								Add property
							</button>
						</div>

						{errorMessage && (
							<p className="text-[13px] text-red-400 mt-[8px]">
								{errorMessage}
							</p>
						)}
					</form>
				</DialogBody>

				<DialogFooter>
					<DialogClose asChild>
						<Button variant="filled" size="large">
							Cancel
						</Button>
					</DialogClose>
					<Button
						type="submit"
						form="structured-output-form"
						variant="solid"
						size="large"
					>
						Update
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
