import { useReactFlow } from "@xyflow/react";
import { useEffect, useState } from "react";

export function Debug() {
	// const { selectedTool } = useToolbar();
	const i = useReactFlow();
	const [viewport, setViewport] = useState(i.getViewport());
	useEffect(() => {
		setInterval(() => {
			setViewport(i.getViewport());
		}, 500);
	}, [i]);

	return (
		<div className="w-[200px] text-white-900 font-mono">
			x: {viewport.x}
			y: {viewport.y}
		</div>
	);
}
