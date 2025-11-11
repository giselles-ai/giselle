import type { FC, HTMLInputTypeAttribute } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// FIXME: Consider integrating with apps/studio.giselles.ai/components/ui/field.tsx when releasing setting-v2
type FieldProps = {
	name: string;
	type: HTMLInputTypeAttribute;
	required?: boolean;
	label: string;
	ignore1password?: boolean;
	value?: string;
	placeholder?: string;
	onChange?: React.ChangeEventHandler<HTMLInputElement>;
	disabled?: boolean;
	inputClassName?: string;
};
export const Field: FC<FieldProps> = ({
	name,
	type,
	required,
	label,
	value,
	placeholder,
	onChange,
	ignore1password = false,
	disabled = false,
	inputClassName,
}) => (
	<div className="grid gap-[4px]">
		<Label htmlFor={name} className="text-text font-geist">
			{label.includes("*") ? (
				<>
					{label.split("*")[0]} <span className="text-error-900">*</span>
					{label.split("*").slice(1).join("*")}
				</>
			) : (
				label
			)}
		</Label>
		<Input
			id={name}
			type={type}
			name={name}
			required={required}
			data-1p-ignore={ignore1password}
			value={value}
			placeholder={placeholder}
			onChange={onChange}
			disabled={disabled}
			className={cn(
				"py-2 rounded-[8px] bg-transparent text-text font-medium text-[14px] leading-[23.8px] font-geist disabled:opacity-50",
				"placeholder:text-[color-mix(in_srgb,var(--color-text-inverse,#fff)_30%,transparent)]",
				inputClassName,
			)}
		/>
	</div>
);
