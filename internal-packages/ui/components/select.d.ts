export type SelectOption = {
	value: string | number;
	label: string;
	icon?: React.ReactNode;
	disabled?: boolean;
};
interface SelectProps<T extends SelectOption> {
	options: Array<T>;
	renderOption?: (option: T) => React.ReactNode;
	placeholder: string;
	value?: string;
	onValueChange?: (value: string) => void;
	defaultValue?: string;
	widthClassName?: string;
	triggerClassName?: string;
	name?: string;
	id?: string;
	renderValue?: (options: T) => string | number;
	itemClassNameForOption?: (option: T) => string | undefined;
	disabled?: boolean;
	renderTriggerContent?: React.ReactNode;
	hideChevron?: boolean;
	ariaLabel?: string;
	contentMinWidthClassName?: string;
	disableHoverBg?: boolean;
}
export declare function Select<T extends SelectOption>({
	renderOption,
	options,
	placeholder,
	value,
	onValueChange,
	defaultValue,
	widthClassName,
	triggerClassName,
	name,
	id,
	renderValue,
	itemClassNameForOption,
	disabled,
	renderTriggerContent,
	hideChevron,
	ariaLabel,
	contentMinWidthClassName,
	disableHoverBg,
}: SelectProps<T>): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=select.d.ts.map
