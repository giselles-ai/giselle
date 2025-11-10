const APP_GRADIENTS = [
	"bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600",
	"bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600",
	"bg-gradient-to-br from-green-400 via-blue-500 to-purple-600",
] as const;

interface AppCardProps {
	title: string;
	index: number;
	onClick?: () => void;
}

export function AppCard({ title, index, onClick }: AppCardProps) {
	const gradientClass = APP_GRADIENTS[index % APP_GRADIENTS.length];

	return (
		<div className="group w-40">
			{/* Thumbnail area */}
			<button
				type="button"
				onClick={onClick}
				className="relative w-40 aspect-square overflow-hidden rounded-lg transition-all duration-300 hover:scale-105 mb-3"
			>
				<div className={`w-full h-full ${gradientClass}`}>
					<div className="absolute inset-0 bg-background/20" />
				</div>
			</button>

			{/* Text content area */}
			<div className="w-full text-left">
				<h3 className="text-inverse font-semibold text-base group-hover:text-primary-100 transition-colors line-clamp-1">
					{title}
				</h3>
			</div>
		</div>
	);
}
