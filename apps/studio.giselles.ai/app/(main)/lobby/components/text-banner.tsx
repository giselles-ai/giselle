interface TextBannerProps {
	title: string;
	description: string;
	moreLinkText?: string;
	onMoreClick?: () => void;
}

export function TextBanner({
	title,
	description,
	moreLinkText = "More",
	onMoreClick,
}: TextBannerProps) {
	return (
		<div className="w-full sm:flex-1 h-10 px-4 rounded-[8px] bg-blue-muted flex items-center justify-between gap-4">
			<div className="flex items-center gap-2 flex-1 min-w-0">
				<span className="text-sm text-gray-900 font-semibold whitespace-nowrap">
					{title}
				</span>
				<span className="text-[12px] text-gray-900 whitespace-nowrap">
					{description}
				</span>
			</div>
			{moreLinkText &&
				(onMoreClick ? (
					<button
						type="button"
						onClick={onMoreClick}
						className="text-[12px] text-gray-900 underline whitespace-nowrap flex-shrink-0"
					>
						{moreLinkText}
					</button>
				) : (
					<span className="text-[12px] text-gray-900 underline whitespace-nowrap flex-shrink-0">
						{moreLinkText}
					</span>
				))}
		</div>
	);
}
