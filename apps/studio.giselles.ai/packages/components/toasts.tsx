"use client";

import { Toast } from "@giselles-ai/components/toast";
import { useToast } from "@giselles-ai/contexts/toast";

export function Toasts() {
	const { toasts } = useToast();
	return (
		<>
			{toasts.map(({ id, ...props }) => (
				<Toast key={id} {...props} />
			))}
		</>
	);
}
