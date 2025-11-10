"use client";

import { PageHeading } from "@giselle-internal/ui/page-heading";
import { useEffect, useState } from "react";

const LOGIN_COUNT_KEY = "giselle_lobby_login_count";

function getTimeBasedGreeting(username: string) {
	const hour = new Date().getHours();

	if (hour >= 0 && hour < 2) {
		return `Welcome back, ${username}. Night owl mode activated.`;
	}
	if (hour >= 2 && hour < 4) {
		return `Welcome back, ${username}. The quiet hours inspire.`;
	}
	if (hour >= 4 && hour < 6) {
		return `Welcome back, ${username}. Early start, great minds.`;
	}
	if (hour >= 6 && hour < 8) {
		return `Good morning, ${username}. Ready to build?`;
	}
	if (hour >= 8 && hour < 10) {
		return `Good morning, ${username}. Fresh ideas await.`;
	}
	if (hour >= 10 && hour < 12) {
		return `Good morning, ${username}. Time to create.`;
	}
	if (hour >= 12 && hour < 14) {
		return `Good afternoon, ${username}. Ready to ship?`;
	}
	if (hour >= 14 && hour < 16) {
		return `Good afternoon, ${username}. Momentum building.`;
	}
	if (hour >= 16 && hour < 18) {
		return `Good afternoon, ${username}. Almost there.`;
	}
	if (hour >= 18 && hour < 20) {
		return `Good evening, ${username}. Ready to build?`;
	}
	if (hour >= 20 && hour < 22) {
		return `Good evening, ${username}. Night session begins.`;
	}
	// 22:00-23:59
	return `Welcome back, ${username}. Still crafting magic.`;
}

function getGreeting(username: string, loginCount: number) {
	if (loginCount === 1) {
		return `Welcome, ${username}. Let's start your journey.`;
	}
	if (loginCount === 2) {
		return `Welcome, ${username}. Ready to build your first agent?`;
	}
	if (loginCount === 3) {
		return `Welcome back, ${username}. Getting comfortable?`;
	}
	if (loginCount === 4) {
		return `Welcome back, ${username}. You're making progress.`;
	}
	if (loginCount === 5) {
		return `Welcome back, ${username}. You're off to a great start.`;
	}
	// 6回目以降は時間帯ベースのメッセージ
	return getTimeBasedGreeting(username);
}

interface GreetingHeadingProps {
	username: string;
}

export function GreetingHeading({ username }: GreetingHeadingProps) {
	const [greeting, setGreeting] = useState<string>("");
	const [loginCount, setLoginCount] = useState<number>(0);

	useEffect(() => {
		// Get or initialize login count from localStorage
		const storedCount = localStorage.getItem(LOGIN_COUNT_KEY);
		let currentCount = storedCount ? parseInt(storedCount, 10) : 0;

		// Increment login count
		currentCount += 1;
		localStorage.setItem(LOGIN_COUNT_KEY, currentCount.toString());
		setLoginCount(currentCount);

		// Set initial greeting
		setGreeting(getGreeting(username, currentCount));

		// For login counts 6+, update greeting based on time every 2 hours
		if (currentCount >= 6) {
			const updateGreeting = () => {
				setGreeting(getTimeBasedGreeting(username));
			};

			// Update immediately
			updateGreeting();

			// Calculate milliseconds until next 2-hour boundary
			const getMsUntilNextBoundary = () => {
				const now = new Date();
				const currentHour = now.getHours();
				const nextBoundary = Math.ceil((currentHour + 1) / 2) * 2;
				const nextDate = new Date(now);
				nextDate.setHours(nextBoundary, 0, 0, 0);
				return nextDate.getTime() - now.getTime();
			};

			// Update at next 2-hour boundary
			let interval: NodeJS.Timeout | null = null;
			const timeout = setTimeout(() => {
				updateGreeting();
				// Then update every 2 hours
				interval = setInterval(updateGreeting, 2 * 60 * 60 * 1000);
			}, getMsUntilNextBoundary());

			return () => {
				clearTimeout(timeout);
				if (interval) {
					clearInterval(interval);
				}
			};
		}
	}, [username]);

	if (!greeting) {
		return null;
	}

	return (
		<PageHeading as="div" glow className="shrink-0 !font-light">
			{greeting}
		</PageHeading>
	);
}
