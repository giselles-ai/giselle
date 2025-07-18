"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "../components/glass-dialog-content";
import {
	diagnoseRepositoryConnection,
	updateRepositoryInstallation,
} from "./actions";
import type {
	DiagnosticResult,
	RepositoryIndexWithContentStatus,
} from "./types";

type DiagnosticModalProps = {
	repositoryIndex: RepositoryIndexWithContentStatus;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onComplete?: () => void;
	onDelete?: () => void;
};

export function DiagnosticModal({
	repositoryIndex,
	open,
	onOpenChange,
	onComplete,
	onDelete,
}: DiagnosticModalProps) {
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
					onOpenChange(false);
				}
			} catch (error) {
				console.error("Failed to fix repository:", error);
			}
		});
	}, [repositoryIndex.id, diagnosisResult, onComplete, onOpenChange]);

	const renderDiagnosisResult = () => {
		if (!diagnosisResult) return null;

		if (diagnosisResult.canBeFixed) {
			return (
				<div className="mt-6 p-4 rounded-lg bg-[#39FF7F]/10 border border-[#39FF7F]/20">
					<div className="flex items-center gap-2 mb-2">
						<Check className="h-5 w-5 text-[#39FF7F]" />
						<h4 className="text-white-400 font-medium text-[16px] font-sans">
							Connection can be restored
						</h4>
					</div>
					<p className="text-black-300 text-[14px] font-geist">
						The GitHub App installation has been updated. Click "Restore
						Connection" to fix this repository.
					</p>
				</div>
			);
		}

		return (
			<div className="mt-6 p-4 rounded-lg bg-[#FF3D71]/10 border border-[#FF3D71]/20">
				<div className="flex items-center gap-2 mb-2">
					<h4 className="text-white-400 font-medium text-[16px] font-sans">
						Repository no longer accessible
					</h4>
				</div>
				<p className="text-black-300 text-[14px] font-geist">
					{diagnosisResult.errorMessage ||
						"This repository has been deleted or is no longer accessible with current permissions."}
				</p>
			</div>
		);
	};

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<GlassDialogContent>
				<GlassDialogHeader
					title="Checking Repository Access"
					description={`${repositoryIndex.owner}/${repositoryIndex.repo}`}
					onClose={() => onOpenChange(false)}
				/>

				<div className="py-6">
					{isDiagnosing ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="h-8 w-8 text-[#1663F3] animate-spin" />
							<span className="ml-3 text-[14px] font-geist text-black-300">
								Checking repository access...
							</span>
						</div>
					) : (
						diagnosisResult && renderDiagnosisResult()
					)}
				</div>

				{diagnosisResult && (
					<GlassDialogFooter
						onCancel={() => onOpenChange(false)}
						onConfirm={
							diagnosisResult.canBeFixed
								? handleFix
								: () => {
										onDelete?.();
										onOpenChange(false);
									}
						}
						confirmLabel={
							diagnosisResult.canBeFixed
								? "Restore Connection"
								: "Delete Repository"
						}
						isPending={isFixing}
						variant={diagnosisResult.canBeFixed ? "default" : "destructive"}
					/>
				)}

				{!diagnosisResult && (
					<GlassDialogFooter
						onCancel={() => onOpenChange(false)}
						isPending={isDiagnosing}
						confirmLabel="Processing..."
					/>
				)}
			</GlassDialogContent>
		</Dialog.Root>
	);
}
