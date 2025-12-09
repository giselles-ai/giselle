"use client";

export default function Loading() {
	return (
		<div className="flex h-screen bg-bg">
			{/* Sidebar placeholder */}
			<div className="w-[200px] bg-bg border-r border-border animate-pulse">
				<div className="p-4 border-b border-border">
					<div className="h-6 bg-surface/10 rounded mb-4"></div>
					<div className="h-8 bg-surface/10 rounded"></div>
				</div>
				<div className="p-4 space-y-3">
					<div className="h-4 bg-surface/10 rounded"></div>
					<div className="h-4 bg-surface/10 rounded"></div>
					<div className="h-4 bg-surface/10 rounded"></div>
				</div>
			</div>

			{/* Main content placeholder */}
			<div className="flex-1 p-6">
				<div className="max-w-[900px] mx-auto space-y-6 animate-pulse">
					{/* Title placeholder */}
					<div className="text-center">
						<div className="h-8 bg-surface/10 rounded mx-auto w-64 mb-6"></div>
					</div>

					{/* Form placeholder */}
					<div className="space-y-4">
						<div className="h-12 bg-surface/10 rounded"></div>
						<div className="h-12 bg-surface/10 rounded"></div>
						<div className="h-10 bg-surface/10 rounded w-32"></div>
					</div>

					{/* Table placeholder */}
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<div className="h-6 bg-surface/10 rounded w-20"></div>
							<div className="flex gap-2">
								<div className="h-8 bg-surface/10 rounded w-16"></div>
								<div className="h-8 bg-surface/10 rounded w-16"></div>
							</div>
						</div>
						<div className="space-y-2">
							<div className="h-16 bg-surface/10 rounded"></div>
							<div className="h-16 bg-surface/10 rounded"></div>
							<div className="h-16 bg-surface/10 rounded"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
