import { useCallback, useEffect, useRef } from "react";

export function usePopupWindow(url: string) {
	const popupRef = useRef<Window | null>(null);

	const open = useCallback(() => {
		const width = 800;
		const height = 800;
		const left = window.screenX + (window.outerWidth - width) / 2;
		const top = window.screenY + (window.outerHeight - height) / 2;

		// Fix for relative URLs: if URL starts with '/', prepend the origin
		const fullUrl = url.startsWith("/")
			? `${window.location.origin}${url}`
			: url;
		try {
			popupRef.current = window.open(
				fullUrl,
				"Configure GitHub App",
				`width=${width},height=${height},top=${top},left=${left},popup=1`,
			);

			if (!popupRef.current) {
				console.warn("Failed to open popup window");
			}
		} catch (error) {
			console.error("Error opening popup window:", error);
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
