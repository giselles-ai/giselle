import clsx from "clsx";
import { EyeIcon, XIcon } from "lucide-react";

interface ReadOnlyBannerProps {
	className?: string;
	onDismiss?: () => void;
	showDismiss?: boolean;
	userRole?: "viewer" | "guest" | "editor" | "owner";
}

export function ReadOnlyBanner({
	className,
	onDismiss,
	showDismiss = true,
	userRole = "viewer",
}: ReadOnlyBannerProps) {
	// Display different messages based on user role
	const getMessage = () => {
		switch (userRole) {
			case "guest":
				return "ゲストモード：このAppは読み取り専用です。プレビューのみ実行できます。";
			case "viewer":
				return "Read-only access: You can view this app but require permissions to edit.";
			default:
				return "読み取り専用モード";
		}
	};

	return (
		<div
			className={clsx(
				"flex items-center justify-between px-4 py-2 bg-[rgba(255,229,81,0.20)] border-b border-black-700",
				className,
			)}
		>
			<div className="flex items-center justify-center gap-2 px-[8px] py-[4px] bg-[rgba(255,229,81,0.20)] border border-[#FFE551] rounded-[14px]">
				<EyeIcon size={16} className="text-[#FFE551]" />
				<span className="text-[12px] font-semibold text-[#FFE551] text-center font-['Geist']">
					{getMessage()}
				</span>
			</div>

			{showDismiss && onDismiss && (
				<button
					onClick={onDismiss}
					className="text-white-800 hover:text-white-900 p-1 rounded-full"
					aria-label="Close"
					type="button"
				>
					<XIcon size={16} />
				</button>
			)}
		</div>
	);
}

// Simple badge version (displayed next to "Text file" in the header)
export function ReadOnlyBadge({ className }: { className?: string }) {
	return (
		<div
			className={clsx(
				"inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(255,229,81,0.20)] border border-[#FFE551]",
				"text-[12px] font-semibold text-[#FFE551] font-['Geist']",
				className,
			)}
		>
			<EyeIcon size={12} className="text-[#FFE551]" />
			<span>Read Only</span>
		</div>
	);
}
