import type React from "react";

export interface ScrollableContainerProps {
	children: React.ReactNode;
	className?: string;
}

/**
 * A reusable scrollable container with custom scrollbar styling
 * Used across GitHub trigger components to maintain consistent scrollbar appearance
 */
export function ScrollableContainer({
	children,
	className = "",
}: ScrollableContainerProps) {
	return (
		<div className={`overflow-y-auto custom-scrollbar ${className}`}>
			{children}
			<style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.15);
          border-radius: 2px;
        }
      `}</style>
		</div>
	);
}
