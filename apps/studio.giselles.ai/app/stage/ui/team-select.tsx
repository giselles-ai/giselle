"use client";

import { Select, type SelectOption } from "@giselle-internal/ui/select";
import { useMemo } from "react";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";

export interface TeamSelectOption {
	value: string;
	label: string;
	avatarUrl?: string;
	disabled?: boolean;
}

export interface TeamSelectProps {
	options: TeamSelectOption[];
	value: string;
	onValueChange: (value: string) => void;
	placeholder?: string;
	id?: string;
	name?: string;
	/** Optional utility classes forwarded to internal Select */
	widthClassName?: string;
	triggerClassName?: string;
}

/**
 * TeamSelect
 * Minimal wrapper around internal Select to unify the team dropdown UI across /stage.
 * - Shows team avatar (when provided) next to the selected label in the trigger
 * - Keeps API surface small and obvious (value/onValueChange/options)
 */
export function TeamSelect({
	options,
	value,
	onValueChange,
	placeholder = "Select team",
	id,
	name,
	widthClassName,
	triggerClassName,
}: TeamSelectProps) {
	const selectOptions: SelectOption[] = useMemo(
		() =>
			options.map((team) => ({
				value: team.value,
				label: team.label,
				disabled: team.disabled,
				icon: team.avatarUrl ? (
					<AvatarImage
						avatarUrl={team.avatarUrl}
						width={24}
						height={24}
						alt={team.label}
					/>
				) : undefined,
			})),
		[options],
	);

	return (
		<Select
			id={id}
			name={name}
			placeholder={placeholder}
			options={selectOptions}
			renderOption={(o) => o.label}
			showIconInTrigger
			value={value}
			onValueChange={onValueChange}
			widthClassName={widthClassName}
			triggerClassName={triggerClassName}
		/>
	);
}
