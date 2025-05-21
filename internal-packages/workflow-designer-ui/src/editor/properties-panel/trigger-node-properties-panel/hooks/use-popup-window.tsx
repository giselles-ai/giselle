import { useCallback, useEffect, useRef } from "react";

export function usePopupWindow(url: string) {
	const popupRef = useRef<Window | null>(null);

	const open = useCallback(() => {
		const width = 800;
		const height = 800;
		const left = window.screenX + (window.outerWidth - width) / 2;
		const top = window.screenY + (window.outerHeight - height) / 2;

		popupRef.current = window.open(
			url,
			"Configure GitHub App",
			`width=${width},height=${height},top=${top},left=${left},popup=1`,
		);

		if (!popupRef.current) {
			console.warn("Failed to open popup window");
		}
	}, [url]);

	useEffect(() => {
		return () => {
			if (popupRef.current && !popupRef.current.closed) {
				popupRef.current.close();
			}
		};
	}, []);

	return { open };
}
