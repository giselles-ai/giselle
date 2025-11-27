"use client";

import { useState, useTransition } from "react";
import {
	type CancelSubscriptionResult,
	cancelSubscription,
} from "@/services/teams/actions/cancel-subscription";
import { Button } from "../components/button";

type CancelSubscriptionButtonProps = {
	subscriptionId: string;
};

export function CancelSubscriptionButton({
	subscriptionId,
}: CancelSubscriptionButtonProps) {
	const [isPending, startTransition] = useTransition();
	const [showConfirm, setShowConfirm] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Only show for v2 subscriptions
	if (!subscriptionId.startsWith("bpps_")) {
		return null;
	}

	const handleCancel = () => {
		setError(null);
		startTransition(async () => {
			const result: CancelSubscriptionResult = await cancelSubscription();
			if (!result.success) {
				setError(result.error);
				setShowConfirm(false);
			}
		});
	};

	if (showConfirm) {
		return (
			<div className="flex flex-col gap-2">
				<p className="text-sm text-warning-900">
					Are you sure you want to cancel your subscription? Your team will be
					downgraded to the Free plan.
				</p>
				<div className="flex gap-2">
					<Button
						type="button"
						variant="destructive"
						className="px-4"
						onClick={handleCancel}
						disabled={isPending}
					>
						{isPending ? "Cancelling..." : "Yes, Cancel"}
					</Button>
					<Button
						type="button"
						variant="default"
						className="px-4"
						onClick={() => setShowConfirm(false)}
						disabled={isPending}
					>
						No, Keep Subscription
					</Button>
				</div>
				{error && <p className="text-sm text-error-900">{error}</p>}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<Button
				type="button"
				variant="link"
				className="px-4"
				onClick={() => setShowConfirm(true)}
			>
				Cancel Subscription
			</Button>
			{error && <p className="text-sm text-error-900">{error}</p>}
		</div>
	);
}
