"use client";

import { FormField } from "@giselle-internal/ui/form-field";
import { DEFAULT_EMBEDDING_PROFILE_ID } from "@giselle-sdk/data-type";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus } from "lucide-react";
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import { GlassButton } from "@/components/ui/glass-button";
import {
	GlassDialogBody,
	GlassDialogContent,
	GlassDialogFooter,
	GlassDialogHeader,
} from "../components/glass-dialog-content";
import { DOCUMENT_EMBEDDING_PROFILES } from "./document-embedding-profiles";
import type { ActionResult } from "./types";

type DocumentVectorStoreCreateDialogProps = {
	createAction: (
		name: string,
		embeddingProfileIds: number[],
	) => Promise<ActionResult>;
};

export function DocumentVectorStoreCreateDialog({
	createAction,
}: DocumentVectorStoreCreateDialogProps) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const availableProfiles = useMemo(
		() => Object.entries(DOCUMENT_EMBEDDING_PROFILES),
		[],
	);
	const selectableProfiles = useMemo(
		() =>
			availableProfiles.filter(([, profile]) => profile.provider !== "cohere"),
		[availableProfiles],
	);
	const defaultProfileIds = useMemo(() => {
		const primaryIds = selectableProfiles.map(([id]) => Number(id));
		const fallbackIds =
			primaryIds.length > 0
				? primaryIds
				: availableProfiles.map(([id]) => Number(id));
		if (fallbackIds.includes(DEFAULT_EMBEDDING_PROFILE_ID)) {
			return [DEFAULT_EMBEDDING_PROFILE_ID];
		}
		return fallbackIds.length > 0 ? [fallbackIds[0]] : [];
	}, [selectableProfiles, availableProfiles]);
	const [selectedProfiles, setSelectedProfiles] = useState<number[]>(() => [
		...defaultProfileIds,
	]);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (open) {
			setSelectedProfiles([...defaultProfileIds]);
			setError(null);
		}
	}, [open, defaultProfileIds]);

	const toggleProfile = useCallback((profileId: number) => {
		setSelectedProfiles((prev) => {
			const isSelected = prev.includes(profileId);
			if (isSelected) {
				if (prev.length === 1) {
					return prev;
				}
				return prev.filter((id) => id !== profileId);
			}
			return [...prev, profileId];
		});
	}, []);

	const onSubmit = useCallback(() => {
		if (selectedProfiles.length === 0) {
			setError("Select at least one embedding profile");
			return;
		}
		setError(null);
		startTransition(async () => {
			const result = await createAction(name.trim(), selectedProfiles);
			if (result.success) {
				setOpen(false);
				setName("");
				setSelectedProfiles([...defaultProfileIds]);
			} else {
				setError(result.error);
			}
		});
	}, [createAction, name, selectedProfiles, defaultProfileIds]);

	return (
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<Dialog.Trigger asChild>
				<GlassButton className="whitespace-nowrap">
					<span className="grid place-items-center rounded-full size-4 bg-primary-200 opacity-50">
						<Plus className="size-3 text-black-900" />
					</span>
					New Vector Store
				</GlassButton>
			</Dialog.Trigger>

			<GlassDialogContent>
				<GlassDialogHeader
					title="Create Vector Store"
					description="Create a new Vector Store for your documents."
					onClose={() => setOpen(false)}
				/>

				<GlassDialogBody>
					<div className="flex flex-col gap-4">
						<FormField
							label="Name"
							placeholder="e.g. Product Docs"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
						{/* Embedding Models, styled like Register Repository */}
						<div className="mt-4">
							<div className="text-white-400 text-[14px] leading-[16.8px] font-sans mb-2">
								Embedding Models
							</div>
							<div className="text-white-400/60 text-[12px] mb-3">
								Select at least one embedding model for indexing
							</div>
							<div className="space-y-2">
								{selectableProfiles.map(([id, p]) => {
									const profileId = Number(id);
									const isSelected = selectedProfiles.includes(profileId);
									const isLastSelected =
										selectedProfiles.length === 1 && isSelected;
									return (
										<label
											key={profileId}
											className="flex items-start gap-3 p-3 rounded-lg bg-surface hover:bg-white/5 transition-colors"
										>
											<input
												type="checkbox"
												checked={isSelected}
												disabled={isPending || isLastSelected}
												onChange={() => toggleProfile(profileId)}
												className="mt-1 w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
											/>
											<div className="flex-1">
												<div className="text-white-400 text-[14px] font-medium">
													{p.name}
												</div>
												<div className="text-white-400/60 text-[12px] mt-1">
													Provider: {p.provider} • Dimensions {p.dimensions}
												</div>
											</div>
										</label>
									);
								})}
							</div>
						</div>
						{error ? <p className="text-error-900 text-sm">{error}</p> : null}
					</div>
				</GlassDialogBody>

				<GlassDialogFooter
					onCancel={() => setOpen(false)}
					onConfirm={onSubmit}
					confirmLabel="Create"
					isPending={isPending}
					confirmButtonType="button"
				/>
			</GlassDialogContent>
		</Dialog.Root>
	);
}
