"use client";

import { useEffect, useState } from "react";

export type ViewType = "list" | "carousel";

interface ViewPreferences {
	viewType: ViewType;
}

const DEFAULT_PREFERENCES: ViewPreferences = {
	viewType: "list",
};

const STORAGE_KEY = "giselle-view-preferences";

function getStoredPreferences(): ViewPreferences {
	if (typeof window === "undefined") {
		return DEFAULT_PREFERENCES;
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return DEFAULT_PREFERENCES;

		const parsed = JSON.parse(stored);
		return {
			viewType: parsed.viewType === "carousel" ? "carousel" : "list",
		};
	} catch {
		return DEFAULT_PREFERENCES;
	}
}

function savePreferences(preferences: ViewPreferences): void {
	if (typeof window === "undefined") return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
	} catch {
		// Silently fail if localStorage is not available
	}
}

export function useViewPreferences() {
	const [preferences, setPreferences] =
		useState<ViewPreferences>(DEFAULT_PREFERENCES);
	const [isHydrated, setIsHydrated] = useState(false);

	// Hydrate from localStorage on mount
	useEffect(() => {
		const storedPreferences = getStoredPreferences();
		setPreferences(storedPreferences);
		setIsHydrated(true);
	}, []);

	// Save to localStorage when preferences change
	useEffect(() => {
		if (isHydrated) {
			savePreferences(preferences);
		}
	}, [preferences, isHydrated]);

	const setViewType = (viewType: ViewType) => {
		setPreferences((prev) => ({ ...prev, viewType }));
	};

	const isCarouselView = preferences.viewType === "carousel";

	return {
		viewType: preferences.viewType,
		isCarouselView,
		setViewType,
		setIsCarouselView: (isCarousel: boolean) =>
			setViewType(isCarousel ? "carousel" : "list"),
		isHydrated,
	};
}
