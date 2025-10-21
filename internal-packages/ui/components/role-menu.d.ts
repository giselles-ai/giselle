export type RoleMenuOption = {
	value: string;
	label: string;
};
export interface RoleMenuProps {
	value: string;
	options: RoleMenuOption[];
	onChange?: (value: string) => void;
	canEdit?: boolean;
	canRemove?: boolean;
	onRemove?: () => void;
	className?: string;
	widthClassName?: string;
	triggerClassName?: string;
}
export declare function RoleMenu({
	value,
	options,
	onChange,
	canEdit,
	canRemove,
	onRemove,
	className,
	widthClassName,
	triggerClassName,
}: RoleMenuProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=role-menu.d.ts.map
