// Lightweight alternative to GSAP's quickSetter
export function createQuickSetter(
	el: HTMLElement,
	cssVar: string,
	unit = "px",
) {
	let frame: number | null = null;
	let lastValue: number | null = null;
	return (value: number) => {
		lastValue = value;
		if (frame === null) {
			frame = requestAnimationFrame(() => {
				if (lastValue !== null) {
					el.style.setProperty(cssVar, `${lastValue}${unit}`);
				}
				frame = null;
			});
		}
	};
}
