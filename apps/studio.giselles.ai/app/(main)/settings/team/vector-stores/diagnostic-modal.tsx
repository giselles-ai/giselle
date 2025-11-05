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
} from "@giselle-internal/ui/dialog";
import { Check, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import type { RepositoryWithStatuses } from "@/lib/vector-stores/github";
import { Button } from "../../components/button";
import {
	diagnoseRepositoryConnection,
	updateRepositoryInstallation,
} from "./actions";
import type { DiagnosticResult } from "./types";

type DiagnosticModalProps = {
	repositoryData: RepositoryWithStatuses;
	open: boolean;
	setOpen: (open: boolean) => void;
	onComplete?: () => void;
	onDelete?: () => void;
};

export function DiagnosticModal({
	repositoryData,
	open,
	setOpen,
	onComplete,
	onDelete,
}: DiagnosticModalProps) {
	const { repositoryIndex } = repositoryData;
	const [diagnosisResult, setDiagnosisResult] =
		useState<DiagnosticResult | null>(null);
	const [isFixing, startFixTransition] = useTransition();
	const [isDiagnosing, setIsDiagnosing] = useState(false);

	const runDiagnosis = useCallback(async () => {
		setIsDiagnosing(true);

		try {
			const result = await diagnoseRepositoryConnection(repositoryIndex.id);
			setDiagnosisResult(result);
		} catch (error) {
			console.error("Diagnosis failed:", error);
			setDiagnosisResult({
				canBeFixed: false,
				reason: "diagnosis-failed",
				errorMessage: "Failed to diagnose the connection issue",
			});
		} finally {
			setIsDiagnosing(false);
		}
	}, [repositoryIndex.id]);

	useEffect(() => {
		if (open) {
			runDiagnosis();
		} else {
			setDiagnosisResult(null);
		}
	}, [open, runDiagnosis]);

	const handleFix = useCallback(() => {
		startFixTransition(async () => {
			try {
				if (diagnosisResult?.canBeFixed) {
					await updateRepositoryInstallation(
						repositoryIndex.id,
						diagnosisResult.newInstallationId,
					);
					onComplete?.();
					setOpen(false);
				}
			} catch (error) {
				console.error("Failed to fix repository:", error);
			}
		});
	}, [repositoryIndex.id, diagnosisResult, onComplete, setOpen]);

	const renderDiagnosisResult = () => {
		if (!diagnosisResult) return null;

		if (diagnosisResult.canBeFixed) {
			return (
				<div className="mt-6 p-4 rounded-lg bg-[#39FF7F]/10 border border-[#39FF7F]/20">
					<div className="flex items-center gap-2 mb-2">
						<Check className="h-5 w-5 text-[#39FF7F]" />
						<h4 className="text-inverse font-medium text-[16px] font-sans">
							Connection can be restored
						</h4>
					</div>
					<p className="text-text/60 text-[14px] font-geist">
						Click Restore Connection to reconnect and continue ingesting data
						from this repository.
					</p>
				</div>
			);
		}

		return (
			<div className="mt-6 p-4 rounded-lg bg-[#FF3D71]/10 border border-[#FF3D71]/20">
				<div className="flex items-center gap-2 mb-2">
					<h4 className="text-inverse font-medium text-[16px] font-sans">
						Repository no longer accessible
					</h4>
				</div>
				<p className="text-text/60 text-[14px] font-geist">
					{diagnosisResult.errorMessage ||
						"This repository has been deleted or is no longer accessible with current permissions."}
				</p>
			</div>
		);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent variant="glass">
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle className="font-sans text-[20px] font-medium tracking-tight text-inverse">
							Checking Repository Access
						</DialogTitle>
						<DialogClose className="rounded-sm text-inverse opacity-70 hover:opacity-100 focus:outline-none">
							<X className="h-5 w-5" />
							<span className="sr-only">Close</span>
						</DialogClose>
					</div>
					<DialogDescription className="font-geist mt-2 text-[14px] text-text-muted">
						{`${repositoryIndex.owner}/${repositoryIndex.repo}`}
					</DialogDescription>
				</DialogHeader>

				<DialogBody>
					<div className="py-6">
						{isDiagnosing ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="h-8 w-8 text-[#1663F3] animate-spin" />
								<span className="ml-3 text-[14px] font-geist text-text/60">
									Checking repository access...
								</span>
							</div>
						) : (
							diagnosisResult && renderDiagnosisResult()
						)}
					</div>
				</DialogBody>

				{diagnosisResult && (
					<DialogFooter>
						<div className="mt-6 flex justify-end gap-x-3">
							<Button
								variant="link"
								onClick={() => setOpen(false)}
								disabled={isFixing}
							>
								Cancel
							</Button>
							<Button
								variant={diagnosisResult.canBeFixed ? "primary" : "destructive"}
								onClick={
									diagnosisResult.canBeFixed
										? handleFix
										: () => {
												onDelete?.();
												setOpen(false);
											}
								}
								disabled={isFixing}
							>
								{isFixing
									? "Processing..."
									: diagnosisResult.canBeFixed
										? "Restore Connection"
										: "Delete Repository"}
							</Button>
						</div>
					</DialogFooter>
				)}

				{!diagnosisResult && (
					<DialogFooter>
						<div className="mt-6 flex justify-end gap-x-3">
							<Button
								variant="link"
								onClick={() => setOpen(false)}
								disabled={isDiagnosing}
							>
								Cancel
							</Button>
							<Button variant="primary" disabled>
								Processing...
							</Button>
						</div>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
}
