"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { type Organization, OrganizationSelect } from "./organization-select";

interface OrganizationSectionProps {
	organizations: Organization[];
	defaultOrganizationId?: string;
	onOrganizationChange: (organizationId: string) => void;
	disabled?: boolean;
	children?: ReactNode;
	className?: string;
}

/**
 * A section component to display the Organization selector with a heading
 */
export function OrganizationSection({
	organizations,
	defaultOrganizationId,
	onOrganizationChange,
	disabled = false,
	children,
	className,
}: OrganizationSectionProps) {
	return (
		<div className={cn("flex flex-col space-y-2", className)}>
			<h3 className="text-sm font-medium text-white/60">Organization</h3>
			<div className="flex items-center gap-3">
				<OrganizationSelect
					organizations={organizations}
					defaultOrganizationId={defaultOrganizationId}
					onOrganizationChange={onOrganizationChange}
					disabled={disabled}
					className="w-full px-0"
				/>
				{children}
			</div>
		</div>
	);
}

export default OrganizationSection;
