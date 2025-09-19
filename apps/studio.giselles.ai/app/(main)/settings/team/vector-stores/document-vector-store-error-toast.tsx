"use client";

import { useEffect, useRef } from "react";
import { Toast } from "@/packages/components/toast";
import { useToast } from "@/packages/contexts/toast";

type DocumentVectorStoreErrorToastProps = {
	message: string | null;
};

export function DocumentVectorStoreErrorToast({
	message,
}: DocumentVectorStoreErrorToastProps) {
	const { addToast, toasts } = useToast();
	const hasShownRef = useRef(false);

	useEffect(() => {
		if (!message || hasShownRef.current) {
			return;
		}
		addToast({
			title: "Error",
			message,
			type: "error",
		});
		hasShownRef.current = true;
	}, [addToast, message]);

	return (
		<>
			{toasts.map((toast) => (
				<Toast key={toast.id} {...toast} />
			))}
		</>
	);
}
