interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	hint?: string;
	containerClassName?: string;
	ref?: React.Ref<HTMLInputElement>;
}
export declare function FormField({
	label,
	error,
	hint,
	containerClassName,
	className,
	ref,
	...props
}: FormFieldProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=form-field.d.ts.map
