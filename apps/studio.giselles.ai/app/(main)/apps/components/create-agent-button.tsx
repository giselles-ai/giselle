"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function CreateAgentButton() {
	const { pending } = useFormStatus();
	return (
		<Button type="submit" disabled={pending} data-loading={pending}>
			New App +
		</Button>
	);
}
