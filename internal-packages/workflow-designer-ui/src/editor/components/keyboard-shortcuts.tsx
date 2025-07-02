import { useEffect } from "react";

export function KeyboardShortcuts({ generate }: { generate: () => void }) {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
			if (
				event.key === "Enter" &&
				((isMac && event.metaKey) || (!isMac && event.ctrlKey))
			) {
				event.preventDefault();
				generate();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [generate]);

	return <></>;
}
