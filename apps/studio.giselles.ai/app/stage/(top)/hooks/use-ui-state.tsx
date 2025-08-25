import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function useUIState() {
	const [isMobile, setIsMobile] = useState(false);
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
	const searchParams = useSearchParams();
	const router = useRouter();
	const isCarouselView = searchParams.get("view") === "carousel";

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);

		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	const setIsCarouselView = (value: boolean) => {
		const params = new URLSearchParams(searchParams.toString());
		if (value) {
			params.set("view", "carousel");
		} else {
			params.delete("view");
		}
		router.push(`?${params.toString()}`, { scroll: false });
	};

	return {
		isMobile,
		isCarouselView,
		setIsCarouselView,
		isSettingsModalOpen,
		setIsSettingsModalOpen,
	};
}
