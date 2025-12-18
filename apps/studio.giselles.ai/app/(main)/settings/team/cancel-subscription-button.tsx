"use client";

import {
	Dialog,
	DialogBody,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@giselle-internal/ui/dialog";
import { X } from "lucide-react";
import { useState, useTransition } from "react";
import { formatTimestamp } from "@/packages/lib/utils";
import {
	type CancelSubscriptionResult,
	cancelSubscription,
} from "@/services/teams/actions/cancel-subscription";
import { Alert, AlertDescription } from "../components/alert";
import { Button } from "../components/button";

type CancelSubscriptionButtonProps = {
	subscriptionId: string;
};

export function CancelSubscriptionButton({
	subscriptionId,
}: CancelSubscriptionButtonProps) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [successData, setSuccessData] = useState<{ willCancelAt: Date } | null>(
		null,
	);

	// Only show for v2 subscriptions
	if (!subscriptionId.startsWith("bpps_")) {
		return null;
	}

	const handleCancel = () => {
		setError(null);
		startTransition(async () => {
			const result: CancelSubscriptionResult = await cancelSubscription();
			if (result.success) {
				setSuccessData({ willCancelAt: result.willCancelAt });
				// Delay reload to allow webhook processing
				setTimeout(() => {
					window.location.reload();
				}, 5000);
			} else {
				setError(result.error);
			}
		});
	};

	const handleCloseDialog = (event?: { preventDefault: () => void }) => {
		if (isPending || successData) {
			event?.preventDefault();
			return;
		}
		setOpen(false);
		setError(null);
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen && (isPending || successData)) {
			return;
		}
		setOpen(newOpen);
		if (!newOpen) {
			setError(null);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button variant="destructive">Cancel Subscription</Button>
			</DialogTrigger>
			<DialogContent
				variant={successData ? "default" : "destructive"}
				onEscapeKeyDown={(e) => handleCloseDialog(e)}
				onPointerDownOutside={(e) => handleCloseDialog(e)}
			>
				{successData ? (
					<>
						<DialogHeader>
							<DialogTitle className="font-sans text-[20px] font-medium tracking-tight text-primary-400">
								Cancellation Scheduled
							</DialogTitle>
							<DialogDescription className="font-geist mt-2 text-[14px] text-white-50">
								Your subscription will be cancelled on{" "}
								{formatTimestamp.toLongDate(successData.willCancelAt.getTime())}
								. The page will refresh shortly.
							</DialogDescription>
						</DialogHeader>
						<DialogBody />
					</>
				) : (
					<>
						<DialogHeader>
							<div className="flex items-center justify-between">
								<DialogTitle className="font-sans text-[20px] font-medium tracking-tight text-error-900">
									Cancel Subscription
								</DialogTitle>
								<DialogClose className="rounded-sm text-inverse opacity-70 hover:opacity-100 focus:outline-none">
									<X className="h-5 w-5" />
									<span className="sr-only">Close</span>
								</DialogClose>
							</div>
							<DialogDescription className="font-geist mt-2 text-[14px] text-error-900/50">
								Are you sure you want to cancel your subscription? Your team
								will be downgraded to the Free plan at the end of your current
								billing period.
							</DialogDescription>
						</DialogHeader>
						{error && (
							<Alert
								variant="destructive"
								className="mt-2 border-error-900/20 bg-error-900/5"
							>
								<AlertDescription className="font-geist text-[12px] font-medium leading-[20.4px] tracking-normal text-error-900/50">
									{error}
								</AlertDescription>
							</Alert>
						)}
						<DialogBody />
						<DialogFooter>
							<div className="mt-6 flex justify-end gap-x-3">
								<Button
									variant="link"
									type="button"
									onClick={() => handleCloseDialog()}
									disabled={isPending}
								>
									Keep Subscription
								</Button>
								<Button
									variant="destructive"
									type="button"
									onClick={handleCancel}
									disabled={isPending}
								>
									{isPending ? "Cancelling..." : "Yes, Cancel Subscription"}
								</Button>
							</div>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
