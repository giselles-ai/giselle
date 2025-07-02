"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import {
	email,
	maxLength,
	minLength,
	object,
	parse,
	picklist,
	pipe,
	string,
} from "valibot";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "../components/button";
import { addTeamMember } from "./actions";

const TeamMemberSchema = object({
	email: pipe(
		string(),
		minLength(1, "Please enter an email address"),
		maxLength(256, "Email must be 256 characters or less"),
		email("Please enter a valid email address"),
	),
	role: picklist(["admin", "member"] as const),
});

export function TeamMembersForm() {
	const [email, setEmail] = useState("");
	const [role, setRole] = useState("member");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string>("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		try {
			const validated = parse(TeamMemberSchema, { email, role });

			setIsLoading(true);

			const formData = new FormData();
			formData.append("email", validated.email);
			formData.append("role", validated.role);

			const result = await addTeamMember(formData);

			if (result.success) {
				setEmail("");
				setRole("member");
			} else {
				setError(result.error ?? "Failed to add team member");
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

	return (
		<div className="flex flex-col gap-2">
			<form
				onSubmit={handleSubmit}
				className="flex items-center gap-[10px]"
				noValidate
			>
				<Input
					type="email"
					placeholder="member@example.com"
					value={email}
					onChange={(e) => {
						setError("");
						setEmail(e.target.value);
					}}
					className="flex-1 py-2 px-3 border-[0.5px] border-black-820/50 rounded-[8px] bg-black-350/20 text-white-900 font-medium text-[14px] leading-[23.8px] font-geist shadow-none placeholder:text-black-400"
					disabled={isLoading}
				/>
				<Select
					value={role}
					onValueChange={(value) => {
						setError("");
						setRole(value);
					}}
					disabled={isLoading}
				>
					<SelectTrigger className="px-4 py-2 border border-white-900 rounded-[8px] h-[40px] w-[123px] bg-transparent text-white-900 shadow-[inset_0_0_4px_0_#ffffff33] [&_svg]:opacity-100 cursor-pointer focus:ring-0 focus:ring-offset-0 focus:outline-none focus:border-white-900">
						<SelectValue />
						<ChevronDown className="h-4 w-4 opacity-50" />
					</SelectTrigger>
					<SelectContent className="border-[0.5px] border-black-400 rounded-[8px] bg-black-850 text-white-900 font-sans">
						<SelectItem
							value="admin"
							className="py-2 pr-2 font-medium text-[12px] leading-[20.4px] transition duration-300 ease-out cursor-pointer focus:bg-primary-900/50"
						>
							Admin
						</SelectItem>
						<SelectItem
							value="member"
							className="py-2 pr-2 font-medium text-[12px] leading-[20.4px] transition duration-300 ease-out cursor-pointer focus:bg-primary-900/50"
						>
							Member
						</SelectItem>
					</SelectContent>
				</Select>
				<Button type="submit" disabled={isLoading} className="h-[40px]">
					Invite
				</Button>
			</form>
			{error && (
				<p className="text-[12px] leading-[20.4px] text-error-900 font-geist">
					{error}
				</p>
			)}
		</div>
	);
}
