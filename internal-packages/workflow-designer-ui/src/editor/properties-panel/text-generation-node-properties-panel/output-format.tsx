import { useState } from "react";
import { SettingDetail } from "../ui/setting-label";
import { StructuredOutputDialog } from "./structured-output-dialog";

export function OutputFormat() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [schema, setSchema] = useState<string | undefined>(undefined);

	return (
		<div>
			<SettingDetail className="mb-[6px]">Structured Output</SettingDetail>
			<button
				type="button"
				onClick={() => setIsDialogOpen(true)}
				className="w-full rounded-[8px] border border-white/10 bg-white/5 px-[12px] py-[8px] text-[13px] text-inverse/80 hover:text-inverse hover:bg-white/10 transition-colors text-left"
			>
				{schema ? "Edit Structured Output" : "Set Structured Output"}
			</button>
			{schema && (
				<pre className="mt-[4px] rounded-[6px] bg-black/20 p-[8px] text-[11px] text-text/50 font-mono overflow-auto max-h-[100px]">
					{schema}
				</pre>
			)}
			<StructuredOutputDialog
				isOpen={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				title="Text Generation Node — Structured Output"
				description="Define a JSON Schema for the text generation output."
				initialSchema={schema}
				onSave={(value) => {
					setSchema(value);
				}}
				showPreview={false}
			/>
		</div>
	);
}
