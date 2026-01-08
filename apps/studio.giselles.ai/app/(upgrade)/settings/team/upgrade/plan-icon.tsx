import { Orbit } from "lucide-react";
import { MemberIcon } from "@/packages/components/icons/member-icon";
import {
	Free as FreeIcon,
	Pro as ProIcon,
} from "@/packages/components/icons/ui";

export function CircleIcon({
	variant,
}: {
	variant: "free" | "pro" | "team" | "enterprise";
}) {
	const glyph =
		variant === "enterprise" ? (
			<FreeIcon />
		) : variant === "team" ? (
			<MemberIcon />
		) : variant === "pro" ? (
			<ProIcon />
		) : (
			<Orbit className="h-6 w-6" />
		);

	return (
		<div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-[#ffffff33] border border-[#dddddd99] shadow-[1px_1px_0_#dddddd,-1px_-1px_0_#ffffff] text-white-100">
			{glyph}
		</div>
	);
}
