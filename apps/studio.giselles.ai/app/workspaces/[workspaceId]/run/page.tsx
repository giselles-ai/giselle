import { Header, Viewer } from "@giselle-internal/workflow-designer-ui";

export default function () {
	return (
		<div className="flex flex-col h-screen bg-black-900">
			<Header />
			<Viewer />
		</div>
	);
}
