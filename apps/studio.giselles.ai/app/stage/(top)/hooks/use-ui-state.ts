import { useEffect, useState } from "react";
import { useViewPreferences } from "@/hooks/use-view-preferences";

export function useUIState() {
	const [isMobile, setIsMobile] = useState(false);
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
	const { isCarouselView, setIsCarouselView } = useViewPreferences();

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);

		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	return {
		isMobile,
		isCarouselView,
		setIsCarouselView,
		isSettingsModalOpen,
		setIsSettingsModalOpen,
	};
}
