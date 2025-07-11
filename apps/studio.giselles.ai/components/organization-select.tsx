"use client";

import { useEffect, useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export interface Organization {
	id: string;
	name: string;
}

interface OrganizationSelectProps {
	organizations: Organization[];
	defaultOrganizationId?: string;
	onOrganizationChange: (organizationId: string) => void;
	disabled?: boolean;
	className?: string;
}

/**
 * OrganizationSelect component that allows users to select an organization from a dropdown
 * and maintains the previous selection when navigating from a previous screen.
 */
export function OrganizationSelect({
	organizations,
	defaultOrganizationId,
	onOrganizationChange,
	disabled = false,
	className,
}: OrganizationSelectProps) {
	const [selectedOrganizationId, setSelectedOrganizationId] = useState<
		string | undefined
	>(defaultOrganizationId);

	// If there's only one organization, select it by default
	useEffect(() => {
		if (organizations.length === 1 && !selectedOrganizationId) {
			const singleOrgId = organizations[0].id;
			setSelectedOrganizationId(singleOrgId);
			onOrganizationChange(singleOrgId);
		}
	}, [organizations, selectedOrganizationId, onOrganizationChange]);

	// Update the selected organization if the default changes
	useEffect(() => {
		if (
			defaultOrganizationId &&
			defaultOrganizationId !== selectedOrganizationId
		) {
			setSelectedOrganizationId(defaultOrganizationId);
		}
	}, [defaultOrganizationId, selectedOrganizationId]);

	const handleOrganizationChange = (value: string) => {
		setSelectedOrganizationId(value);
		onOrganizationChange(value);
	};

	// If there are no organizations, don't render the component
	if (organizations.length === 0) {
		return null;
	}

	return (
		<Select
			value={selectedOrganizationId}
			onValueChange={handleOrganizationChange}
			disabled={disabled}
		>
			<SelectTrigger className={className}>
				<SelectValue placeholder="Select an organization" />
			</SelectTrigger>
			<SelectContent>
				{organizations.map((organization) => (
					<SelectItem key={organization.id} value={organization.id}>
						{organization.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
