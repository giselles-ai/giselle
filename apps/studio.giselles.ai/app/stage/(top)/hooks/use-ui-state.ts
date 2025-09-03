import { useEffect, useState } from "react";

export function useUIState() {
	const [isMobile, setIsMobile] = useState(false);
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

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
		isSettingsModalOpen,
		setIsSettingsModalOpen,
	};
}
