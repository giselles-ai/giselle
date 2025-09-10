"use client";

import { useState } from "react";

// Custom Megaphone icon from Lucide v0.15.31
function MegaphoneIcon({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<title>Megaphone icon</title>
			<path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
			<path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14" />
			<path d="M8 6v8" />
		</svg>
	);
}

export function UpdateNotificationButton() {
	const [hasUnreadUpdates, setHasUnreadUpdates] = useState(true);

	const handleClick = () => {
		console.log("Update notification clicked!");
		setHasUnreadUpdates(false); // Mark as read when clicked
		// TODO: Open dialog in next step
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			className="relative flex items-center justify-center w-[32px] h-[32px] rounded-[6px] bg-transparent hover:bg-white/5 transition-all duration-200 group"
			aria-label="View updates"
		>
			<MegaphoneIcon className="w-[20px] h-[20px] text-white-700 group-hover:opacity-70 transition-all" />
			{/* Notification dot - only show when there are unread updates */}
			{hasUnreadUpdates && (
				<div className="absolute -top-[2px] -right-[2px] w-[8px] h-[8px] bg-[#6B8FF0] rounded-full" />
			)}
		</button>
	);
}
