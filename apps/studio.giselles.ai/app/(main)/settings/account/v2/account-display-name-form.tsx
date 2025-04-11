"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/v2/ui/button";
import type { users } from "@/drizzle";
import { useState } from "react";
import {
	type InferInput,
	maxLength,
	minLength,
	parse,
	pipe,
	string,
} from "valibot";
import { AccountImageForm } from "../../components/v2/account/account-image-form";
import { updateDisplayName } from "../actions";

const DisplayNameSchema = pipe(
	string(),
	minLength(1, "Display name is required"),
	maxLength(256, "Display name must be 256 characters or less"),
);

export function AccountDisplayNameForm({
	displayName: _displayName,
}: { displayName: typeof users.$inferSelect.displayName }) {
	const [isEditingName, setIsEditingName] = useState(false);
	const [displayName, setDisplayName] = useState(
		_displayName ?? "No display name",
	);
	const [tempDisplayName, setTempDisplayName] = useState(displayName);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string>("");

	const handleSaveDisplayName = async () => {
		setError("");

		try {
			const validatedDisplayName = parse(DisplayNameSchema, tempDisplayName);

			setIsLoading(true);

			const formData = new FormData();
			formData.append("displayName", validatedDisplayName);

			const result = await updateDisplayName(formData);

			if (result.success) {
				setDisplayName(validatedDisplayName);
				setIsEditingName(false);
			} else {
				setError("Failed to update display name");
				console.error("Failed to update display name");
			}
		} catch (error) {
			if (error instanceof Error) {
				setError(error.message);
			}
			console.error("Error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancelDislayName = () => {
		setTempDisplayName(displayName);
		setIsEditingName(false);
		setError("");
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setError("");
		setTempDisplayName(e.target.value);
	};

	return (
		<div className="bg-transparent rounded-[8px] border-[0.5px] border-black-400 px-[24px] py-[16px] w-full">
			<div className="flex justify-between items-center gap-2">
				<div className="flex items-center gap-4">
					<AccountImageForm
						avatarUrl={null} // TODO: Add avatarUrl from user data
						displayName={displayName}
					/>
					<span className="text-white-400 font-normal text-[18px] leading-[21.6px] tracking-[-0.011em] font-hubot">
						{displayName}
					</span>
				</div>

				<Dialog open={isEditingName} onOpenChange={setIsEditingName}>
					<DialogTrigger asChild>
						<Button>Edit</Button>
					</DialogTrigger>
					<DialogContent className="gap-y-6 px-[57px] py-[40px] max-w-[380px] w-full bg-black-900 border-none rounded-[16px] bg-linear-to-br/hsl from-black-600 to-black-250 sm:rounded-[16px]">
						<div
							aria-hidden="true"
							className="absolute inset-0 rounded-[16px] border-[0.5px] border-transparent bg-black-900 bg-clip-padding"
						/>
						<DialogHeader className="relative z-10">
							<DialogTitle className="text-white-800 font-semibold text-[20px] leading-[28px] font-hubot text-center">
								Change your Profiles
							</DialogTitle>
						</DialogHeader>
						<form className="flex flex-col gap-y-4 relative z-10">
							<div className="flex flex-col gap-y-2">
								<Label
									htmlFor="tempDisplayName"
									className="text-white-800 font-medium text-[12px] leading-[20.4px] font-geist"
								>
									Your Display Name
								</Label>
								<Input
									id="tempDisplayName"
									value={tempDisplayName}
									onChange={handleChange}
									className="py-2 rounded-[8px] w-full bg-white-30/30 text-black-800 font-medium text-[12px] leading-[20.4px] font-geist shadow-none focus:text-white"
									disabled={isLoading}
								/>
								{error && (
									<p className="text-[12px] leading-[20.4px] text-error-900 font-geist">
										{error}
									</p>
								)}
							</div>
							<div className="flex justify-end space-x-4">
								<Button
									type="button"
									onClick={handleCancelDislayName}
									disabled={isLoading}
									className="w-full h-[38px] bg-transparent border-black-400 text-black-400 text-[16px] leading-[19.2px] tracking-[-0.04em] hover:bg-transparent hover:text-black-400"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={isLoading || !!error}
									onClick={handleSaveDisplayName}
									className="w-full h-[38px] text-[16px] leading-[19.2px] tracking-[-0.04em] "
								>
									Save
								</Button>
							</div>
						</form>
					</DialogContent>
				</Dialog>
			</div>
		</div>
	);
}
