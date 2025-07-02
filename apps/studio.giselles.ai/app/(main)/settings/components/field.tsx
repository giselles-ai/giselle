import type { FC, HTMLInputTypeAttribute } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// FIXME: Consider integrating with apps/studio.giselles.ai/components/ui/field.tsx when releasing setting-v2
type FieldProps = {
	name: string;
	type: HTMLInputTypeAttribute;
	required?: boolean;
	label: string;
	ignore1password?: boolean;
	value?: string;
	disabled?: boolean;
};
export const Field: FC<FieldProps> = ({
	name,
	type,
	required,
	label,
	value,
	ignore1password = false,
	disabled = false,
}) => (
	<div className="grid gap-[4px]">
		<Label htmlFor={name} className="text-white-400 font-geist">
			{label}
		</Label>
		<Input
			id={name}
			type={type}
			name={name}
			required={required}
			data-1p-ignore={ignore1password}
			value={value}
			disabled={disabled}
			className="py-2 border-[0.5px] border-black-820/50 rounded-[8px] bg-black-350/20 text-white-900 font-medium text-[14px] leading-[23.8px] font-geist disabled:opacity-50"
		/>
	</div>
);
