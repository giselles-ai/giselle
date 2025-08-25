import { useEffect, useState } from "react";

const CAROUSEL_VIEW_KEY = "stage-carousel-view";

export function useUIState() {
	const [isMobile, setIsMobile] = useState(false);
	const [isCarouselView, setIsCarouselView] = useState(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem(CAROUSEL_VIEW_KEY);
			return saved ? JSON.parse(saved) : false;
		}
		return false;
	});
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);

		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem(CAROUSEL_VIEW_KEY, JSON.stringify(isCarouselView));
		}
	}, [isCarouselView]);

	return {
		isMobile,
		isCarouselView,
		setIsCarouselView,
		isSettingsModalOpen,
		setIsSettingsModalOpen,
	};
}
