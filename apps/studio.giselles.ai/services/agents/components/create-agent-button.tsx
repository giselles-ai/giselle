"use client";

import { Button } from "@/components/ui/button";
import { type FC, useActionState } from "react";

type CreateAgentButtonProps = {
	createAgentAction: () => Promise<void>;
};
export const CreateAgentButton: FC<CreateAgentButtonProps> = ({
	createAgentAction,
}) => {
	const [_, action, isPending] = useActionState(async () => {
		await createAgentAction();
	}, null);
	return (
		<form action={action}>
			<Button type="submit" disabled={isPending}>
				Create new agent
			</Button>
		</form>
	);
};
