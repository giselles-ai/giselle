export function TooltipAndHotkey({
	text,
	hotkey,
}: {
	text: string;
	hotkey?: string;
}) {
	return (
		<div className="flex items-center gap-1">
			<span>{text}</span>
			{hotkey && (
				<span className="text-black-400 uppercase ml-1">{hotkey}</span>
			)}
		</div>
	);
}
