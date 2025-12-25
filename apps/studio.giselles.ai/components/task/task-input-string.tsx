"use client";

import { useState } from "react";

export function TaskInputString({ value }: { value: string }) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<button
			aria-expanded={isExpanded}
			onClick={() => setIsExpanded((prev) => !prev)}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					setIsExpanded((prev) => !prev);
				}
			}}
			type="button"
			tabIndex={0}
			className="w-full cursor-pointer focus-visible:outline-none relative text-left"
		>
			<div
				className={[
					"whitespace-pre-wrap break-words",
					"transition-[max-height] duration-200 ease-out",
					isExpanded
						? "max-h-[276px] overflow-auto pb-[40px]"
						: "max-h-[55px] overflow-hidden",
				].join(" ")}
			>
				{value}
			</div>
			{/* #090e17 is an adhoc color to mimic the background color, should be the same color if the background is not transparent */}
			<div
				className="pointer-events-none absolute bottom-0 left-0 right-0 h-[27px] bg-gradient-to-t from-[#090e17] to-transparent"
				aria-hidden="true"
			></div>
		</button>
	);
}
