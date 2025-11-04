import type { FC, HTMLInputTypeAttribute } from "react";
import { Input } from "./input";
import { Label } from "./label";

type FieldProps = {
	name: string;
	type: HTMLInputTypeAttribute;
	required?: boolean;
	label: string;
	ignore1password?: boolean;
	value?: string;
	disabled?: boolean;
	className?: string;
};
export const Field: FC<FieldProps> = ({
	name,
	type,
	required,
	label,
	value,
	ignore1password = false,
	disabled = false,
	className,
}) => (
	<div className="grid gap-[8px]">
		<Label htmlFor={name} className="text-[14px] font-sans text-black-200">
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
			className={className}
		/>
	</div>
);
