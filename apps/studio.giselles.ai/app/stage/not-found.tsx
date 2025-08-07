"use client";

import { Button } from "@giselle-internal/ui/button";

export default function NotFound() {
	return (
		<div className="flex h-screen bg-black-900 items-center justify-center">
			<div className="max-w-md mx-auto text-center p-6">
				<div className="mb-6">
					<h2 className="text-xl font-semibold text-white-100 mb-2">
						Page Not Found
					</h2>
					<p className="text-black-600 text-sm">
						The stage page you're looking for doesn't exist or may have been
						moved.
					</p>
				</div>

				<div className="space-y-3">
					<Button
						onClick={() => {
							window.location.assign("/stage");
						}}
						variant="filled"
						className="w-full"
					>
						Go to Stage
					</Button>

					<Button
						onClick={() => {
							window.location.assign("/apps");
						}}
						variant="subtle"
						className="w-full"
					>
						Go to Apps
					</Button>
				</div>
			</div>
		</div>
	);
}
