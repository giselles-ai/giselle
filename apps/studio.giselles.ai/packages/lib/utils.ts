export function pathJoin(...parts: string[]): string {
	const filteredParts = parts.filter((part) => part !== "");

	const processedParts = filteredParts.map((pathPart, index) => {
		let processed = pathPart;
		if (index > 0) {
			processed = processed.replace(/^\/+/, "");
		}
		if (index < filteredParts.length - 1) {
			processed = processed.replace(/\/+$/, "");
		}
		return processed;
	});

	return processedParts.join("/");
}

/**
 * Formats a timestamp number into common English date string formats
 */
export const formatTimestamp = {
	/**
	 * Format: Nov 25, 2024 10:30:45 AM
	 */
	toLongDateTime: (timestamp: number): string => {
		return new Date(timestamp).toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			second: "2-digit",
			hour12: true,
		});
	},

	/**
	 * Format: 11/25/2024 10:30 AM
	 */
	toShortDateTime: (timestamp: number): string => {
		return new Date(timestamp).toLocaleString("en-US", {
			year: "numeric",
			month: "numeric",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	},

	/**
	 * Format: November 25, 2024
	 */
	toLongDate: (timestamp: number): string => {
		return new Date(timestamp).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	},

	/**
	 * Format: 11/25/2024
	 */
	toShortDate: (timestamp: number): string => {
		return new Date(timestamp).toLocaleDateString("en-US", {
			year: "numeric",
			month: "numeric",
			day: "numeric",
		});
	},

	/**
	 * Format: 10:30:45 AM
	 */
	toTime: (timestamp: number): string => {
		return new Date(timestamp).toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			second: "2-digit",
			hour12: true,
		});
	},

	/**
	 * Format: ISO 8601 (2024-11-25T10:30:45Z)
	 * Useful for APIs and database storage
	 */
	toISO: (timestamp: number): string => {
		return new Date(timestamp).toISOString();
	},

	/**
	 * Returns relative time like "2 hours ago", "in 3 days", etc.
	 * Supports both past and future dates
	 */
	toRelativeTime: (timestamp: number): string => {
		const now = Date.now();
		const diff = timestamp - now;
		const absMs = Math.abs(diff);
		const isPast = diff < 0;

		// Time units in milliseconds
		const minute = 60 * 1000;
		const hour = 60 * minute;
		const day = 24 * hour;
		const week = 7 * day;
		const month = 30 * day;
		const year = 365 * day;

		// Helper function to format the time with proper pluralization
		const formatUnit = (value: number, unit: string): string => {
			const plural = value === 1 ? "" : "s";
			return isPast
				? `${value} ${unit}${plural} ago`
				: `in ${value} ${unit}${plural}`;
		};

		if (absMs < minute) {
			return isPast ? "just now" : "in a few seconds";
		}

		if (absMs < hour) {
			const mins = Math.floor(absMs / minute);
			return formatUnit(mins, "minute");
		}

		if (absMs < day) {
			const hrs = Math.floor(absMs / hour);
			return formatUnit(hrs, "hour");
		}

		if (absMs < week) {
			const days = Math.floor(absMs / day);
			return formatUnit(days, "day");
		}

		if (absMs < month) {
			const weeks = Math.floor(absMs / week);
			return formatUnit(weeks, "week");
		}

		if (absMs < year) {
			const months = Math.floor(absMs / month);
			return formatUnit(months, "month");
		}

		const years = Math.floor(absMs / year);
		return formatUnit(years, "year");
	},
};

export function pathnameToFilename(pathname: string) {
	return pathname.split("/").pop() ?? "";
}
