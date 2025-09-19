// Enhanced version with shimmer animation
const widthClasses = {
	12: "w-12",
	16: "w-16",
	24: "w-24",
} as const;

export function NavSkelton() {
	return (
		<div className="w-[300px] flex flex-col pl-[24px] border-[2px] border-transparent my-[8px]">
			{/* Shimmer overlay */}
			<div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

			{/* Header skeleton */}
			<div className="mb-6">
				<div className="flex items-center gap-2 mb-4">
					<div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
					<div className="w-12 h-4 bg-gray-600 rounded animate-pulse"></div>
				</div>
				<div className="w-32 h-6 bg-gray-600 rounded animate-pulse"></div>
			</div>

			{/* Sequence sections skeleton */}
			<div className="space-y-4">
				{/* Sequence 1 */}
				<div className="space-y-2">
					<div className="flex items-center gap-2 p-2 bg-gray-700 rounded animate-pulse">
						<div className="w-4 h-4 bg-gray-600 rounded"></div>
						<div className="w-20 h-4 bg-gray-600 rounded"></div>
						<div className="ml-auto w-4 h-4 bg-gray-600 rounded"></div>
					</div>
					<div className="ml-6 p-2 animate-pulse">
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 bg-gray-600 rounded"></div>
							<div className="w-28 h-4 bg-gray-600 rounded"></div>
						</div>
					</div>
				</div>

				{/* Sequence 2 */}
				<div className="space-y-2">
					<div className="flex items-center gap-2 p-2 bg-gray-700 rounded animate-pulse">
						<div className="w-4 h-4 bg-gray-600 rounded"></div>
						<div className="w-20 h-4 bg-gray-600 rounded"></div>
						<div className="ml-auto w-4 h-4 bg-gray-600 rounded"></div>
					</div>
					<div className="ml-6 space-y-2">
						{([24, 16, 12, 12, 16] as const).map((width, index) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: for skelton
								key={index}
								className="flex items-center gap-2 p-1 animate-pulse"
								style={{ animationDelay: `${index * 0.1}s` }}
							>
								<div className="w-4 h-4 bg-gray-600 rounded"></div>
								<div
									className={`${widthClasses[width]} h-4 bg-gray-600 rounded`}
								></div>
							</div>
						))}
					</div>
				</div>

				{/* Sequence 3 */}
				<div className="space-y-2">
					<div className="flex items-center gap-2 p-2 bg-gray-700 rounded animate-pulse">
						<div className="w-4 h-4 bg-gray-600 rounded"></div>
						<div className="w-20 h-4 bg-gray-600 rounded"></div>
						<div className="ml-auto w-4 h-4 bg-gray-600 rounded"></div>
					</div>
					<div className="ml-6 p-2 animate-pulse">
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 bg-gray-600 rounded"></div>
							<div className="w-20 h-4 bg-gray-600 rounded"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
